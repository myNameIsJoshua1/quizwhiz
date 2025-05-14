# Spring Boot Google Authentication Guide

This guide explains how to implement Google Sign-In authentication in your Spring Boot application without requiring Firebase.

## Step 1: Add Required Dependencies

Add the Google API Client dependency to your `pom.xml`:

```xml
<dependency>
    <groupId>com.google.api-client</groupId>
    <artifactId>google-api-client</artifactId>
    <version>2.0.0</version>
</dependency>
```

## Step 2: Create a Google Token Verifier

Create a new class called `GoogleTokenVerifier.java` in the `cit.edu.quizwhiz.security` package:

```java
package cit.edu.quizwhiz.security;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.Payload;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Collections;

/**
 * Helper class to verify Google ID tokens
 */
@Component
public class GoogleTokenVerifier {

    private final GoogleIdTokenVerifier verifier;

    public GoogleTokenVerifier(@Value("${spring.security.oauth2.client.registration.google.client-id}") String clientId) {
        this.verifier = new GoogleIdTokenVerifier.Builder(
                new NetHttpTransport(), new GsonFactory())
                .setAudience(Collections.singletonList(clientId))
                .build();
    }

    /**
     * Verifies a Google ID token and returns the payload if valid
     * 
     * @param idTokenString the ID token to verify
     * @return the token payload if valid, null otherwise
     * @throws IOException if there's an I/O error
     * @throws GeneralSecurityException if there's a security error
     */
    public Payload verify(String idTokenString) throws IOException, GeneralSecurityException {
        GoogleIdToken idToken = verifier.verify(idTokenString);
        if (idToken != null) {
            return idToken.getPayload();
        }
        return null;
    }
}
```

## Step 3: Update User Controller

Modify your existing `UserController.java` to use the `GoogleTokenVerifier` instead of Firebase:

```java
@RestController
@RequestMapping("/user")
public class UserController {

    JwtUtil jwtUtil = new JwtUtil();

    @Autowired
    private UserService userService;
    
    @Autowired
    private GoogleTokenVerifier googleTokenVerifier;

    // Keep all your existing endpoints...
    
    /**
     * Endpoint for Google login that uses GoogleTokenVerifier instead of Firebase
     */
    @PostMapping("/google")
    public ResponseEntity<?> loginWithGoogle(@RequestBody Map<String, String> payload) {
        System.out.println("Received Google login request. Payload keys: " + payload.keySet());

        String idToken = payload.get("credential");
        System.out.println("Extracted ID token: " + (idToken != null ? "present" : "null"));

        if (idToken == null || idToken.isEmpty()) {
            System.out.println("ID token is missing");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("ID token is required");
        }

        try {
            System.out.println("Attempting to verify Google ID token...");
            
            // Verify the token
            Payload tokenPayload = googleTokenVerifier.verify(idToken);
            
            if (tokenPayload != null) {
                // Get profile information
                String email = tokenPayload.getEmail();
                String name = (String) tokenPayload.get("name");
                String pictureUrl = (String) tokenPayload.get("picture");
                boolean emailVerified = Boolean.TRUE.equals(tokenPayload.getEmailVerified());

                System.out.println("Google token verified. Email: " + email);

                if (!emailVerified) {
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body("Email not verified with Google");
                }

                // Create or get user from database
                UserEntity user = userService.createOrGetOAuthUser(email, name);

                // Generate JWT token
                String jwt = jwtUtil.generateToken(user.getEmail());

                // Prepare response
                Map<String, Object> response = new HashMap<>();
                response.put("user", user);
                response.put("token", jwt);

                return ResponseEntity.ok(response);
            } else {
                System.err.println("Invalid Google ID token");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid Google ID token");
            }
        } catch (GeneralSecurityException | IOException e) {
            System.err.println("Error verifying Google token: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Google login failed: " + e.getMessage());
        } catch (Exception e) {
            System.err.println("Unexpected error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error: " + e.getMessage());
        }
    }
}
```

## Step 4: Test with the Frontend

1. Start your Spring Boot application
2. Access the test page at http://localhost:3000/google-login-test.html
3. Click the "Sign in with Google" button
4. If everything is configured correctly, you should see a successful login response

## Troubleshooting

If you encounter issues:

1. **Backend URL Mismatch**: Ensure the frontend is calling `http://localhost:8080/user/google` 
2. **CORS Issues**: If you see CORS errors, add a CORS configuration to your Spring Boot application
3. **Missing Dependencies**: Make sure the Google API Client dependency is correctly added to your pom.xml
4. **Client ID Mismatch**: Verify that the client ID in your frontend matches the one in your backend

## CORS Configuration

If you encounter CORS issues, add this configuration to your Spring Boot application:

```java
@Configuration
public class CorsConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins("http://localhost:3000")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}
```

## Security Note

This approach directly verifies Google ID tokens without requiring Firebase Authentication. It's a simpler and more direct implementation for your QuizWhiz application. 