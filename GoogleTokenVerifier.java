package com.quizwhiz.security;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.Payload;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.jackson2.JacksonFactory;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Collections;
import java.util.Map;

public class GoogleTokenVerifier {
    // Your Google client ID from credentials
    private static final String CLIENT_ID = "701720913564-vl09c6bh9jsui1rgcs62pcuja7gbs2n5.apps.googleusercontent.com";
    
    private final GoogleIdTokenVerifier verifier;

    public GoogleTokenVerifier() {
        // Create a verifier for Google ID tokens
        this.verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new JacksonFactory())
                .setAudience(Collections.singletonList(CLIENT_ID))
                // Optional: Check for a specific issuer
                .setIssuer("https://accounts.google.com")
                .build();
    }

    /**
     * Verify a Google ID token and extract user data
     * 
     * @param idTokenString the Google ID token to verify
     * @return User data map containing email, name, picture, etc. or null if verification fails
     */
    public Map<String, Object> verifyGoogleIdToken(String idTokenString) {
        try {
            GoogleIdToken idToken = verifier.verify(idTokenString);
            
            if (idToken != null) {
                Payload payload = idToken.getPayload();
                
                // Get user identifier
                String userId = payload.getSubject();
                
                // Get profile information from payload
                String email = payload.getEmail();
                boolean emailVerified = Boolean.valueOf(payload.getEmailVerified());
                String name = (String) payload.get("name");
                String pictureUrl = (String) payload.get("picture");
                String locale = (String) payload.get("locale");
                String familyName = (String) payload.get("family_name");
                String givenName = (String) payload.get("given_name");
                
                // Build user data map
                Map<String, Object> userData = Map.of(
                    "id", userId,
                    "email", email,
                    "emailVerified", emailVerified,
                    "name", name != null ? name : "",
                    "firstName", givenName != null ? givenName : "",
                    "lastName", familyName != null ? familyName : "",
                    "picture", pictureUrl != null ? pictureUrl : "",
                    "locale", locale != null ? locale : "",
                    "provider", "google"
                );
                
                return userData;
            } else {
                return null; // Invalid token
            }
        } catch (GeneralSecurityException | IOException e) {
            e.printStackTrace();
            return null;
        }
    }
} 