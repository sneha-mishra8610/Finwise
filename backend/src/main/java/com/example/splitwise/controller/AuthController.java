package com.example.splitwise.controller;

import com.example.splitwise.model.User;
import com.example.splitwise.repository.UserRepository;
import com.example.splitwise.service.JwtService;
import com.example.splitwise.service.UserService;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final UserService userService;
    private final MongoTemplate mongoTemplate;
    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    @Value("${google.client-id}")
    private String googleClientId;

    public AuthController(UserRepository userRepository, PasswordEncoder passwordEncoder,
                          JwtService jwtService, UserService userService,
                          MongoTemplate mongoTemplate) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.userService = userService;
        this.mongoTemplate = mongoTemplate;
    }

    @PostMapping("/signup")
    public ResponseEntity<AuthResponse> signup(@RequestBody SignupRequest request) {
        try {
            logger.info("Signup request for email: {}", request.getEmail());
            Optional<User> existing = userRepository.findByEmail(request.getEmail());
            if (existing.isPresent()) {
                logger.warn("User already exists: {}", request.getEmail());
                return ResponseEntity.status(HttpStatus.CONFLICT).build();
            }

            User user = new User();
            user.setName(request.getName());
            user.setEmail(request.getEmail());
            String encoded = passwordEncoder.encode(request.getPassword());
            logger.info("Encoded password length: {}", encoded.length());
            user.setPasswordHash(encoded);
            user.setEmailNotificationsEnabled(true);

            User saved = userRepository.save(user);
            logger.info("User saved with id: {}, password stored: {}", saved.getId(), saved.getPasswordHash() != null);
            userService.processInvitationsForNewUser(saved);
            String token = jwtService.generateToken(saved);
            return ResponseEntity.ok(new AuthResponse(saved, token));
        } catch (Exception e) {
            logger.error("Error in signup: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());

        if (userOpt.isEmpty()) {
            System.out.println("User not found");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        User user = userOpt.get();
        if (user.getPasswordHash() == null || !passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        String token = jwtService.generateToken(user);
        return ResponseEntity.ok(new AuthResponse(user, token));
    }

    @PostMapping("/google")
    public ResponseEntity<AuthResponse> googleLogin(@RequestBody GoogleLoginRequest request) {
        try {
            if (googleClientId == null || googleClientId.isBlank()) {
                logger.error("Google OAuth not configured: GOOGLE_CLIENT_ID env var is missing");
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build();
            }

            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(), GsonFactory.getDefaultInstance())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();

            GoogleIdToken idToken = verifier.verify(request.getIdToken());
            if (idToken == null) {
                logger.warn("Invalid Google ID token received");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            GoogleIdToken.Payload payload = idToken.getPayload();
            String googleId = payload.getSubject();           // unique Google user ID
            String email    = payload.getEmail();
            String name     = (String) payload.get("name");
            if (name == null || name.isBlank()) name = email;

            Optional<User> byGoogleId = userRepository.findByGoogleId(googleId);
            User user;

            if (byGoogleId.isPresent()) {
                user = byGoogleId.get();
            } else {
                Optional<User> byEmail = userRepository.findByEmail(email);
                if (byEmail.isPresent()) {
                    user = byEmail.get();
                    mongoTemplate.updateFirst(
                        Query.query(Criteria.where("_id").is(user.getId())),
                        new Update().set("googleId", googleId),
                        User.class
                    );
                    user.setGoogleId(googleId);
                    logger.info("Linked Google account to existing user: {}", email);
                } else {

                    user = new User();
                    user.setName(name);
                    user.setEmail(email);
                    user.setGoogleId(googleId);
                    user.setEmailNotificationsEnabled(true);
                    user = userRepository.save(user);
                    userService.processInvitationsForNewUser(user);
                    logger.info("Created new user via Google OAuth: {}", email);
                }
            }

            String token = jwtService.generateToken(user);
            return ResponseEntity.ok(new AuthResponse(user, token));

        } catch (Exception e) {
            logger.error("Error in Google OAuth login: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
        try {
            logger.info("Reset password request for email: {}", request.getEmail());
            Optional<User> userOpt = userRepository.findByEmail(request.getEmail());
            if (userOpt.isEmpty()) {
                logger.warn("User not found for email: {}", request.getEmail());
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
            }
            User user = userOpt.get();

            logger.info("User found. Password hash exists: {}, Hash length: {}",
                    user.getPasswordHash() != null,
                    user.getPasswordHash() != null ? user.getPasswordHash().length() : "N/A");

            if (user.getPasswordHash() == null || user.getPasswordHash().isEmpty()) {
                logger.error("No password set for user: {}", request.getEmail());
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("No password set for this user - contact support");
            }

            boolean passwordMatches = passwordEncoder.matches(request.getOldPassword(), user.getPasswordHash());
            logger.info("Password match result: {}", passwordMatches);

            if (!passwordMatches) {
                logger.warn("Incorrect old password for user: {}", request.getEmail());
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Current password entered is incorrect");
            }

            user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
            userRepository.save(user);
            logger.info("Password reset successful for user: {}", request.getEmail());
            return ResponseEntity.ok("Password reset successful");
        } catch (Exception e) {
            logger.error("Error in reset password: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Internal server error: " + e.getMessage());
        }
    }

    @PostMapping("/force-reset-password")
    public ResponseEntity<?> forceResetPassword(@RequestBody ForceResetPasswordRequest request) {
        try {
            logger.warn("Force reset password request for email: {}", request.getEmail());
            Optional<User> userOpt = userRepository.findByEmail(request.getEmail());
            if (userOpt.isEmpty()) {
                logger.warn("User not found for force reset email: {}", request.getEmail());
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
            }

            User user = userOpt.get();
            user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
            userRepository.save(user);

            logger.warn("Force password reset successful for user: {}", request.getEmail());
            return ResponseEntity.ok("Password force reset successful");
        } catch (Exception e) {
            logger.error("Error in force reset password: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Internal server error: " + e.getMessage());
        }
    }

    public static class SignupRequest {
        @NotBlank private String name;
        @NotBlank @Email private String email;
        @NotBlank private String password;

        public String getName()  { return name; }
        public void setName(String name) { this.name = name; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    public static class LoginRequest {
        @NotBlank @Email private String email;
        @NotBlank private String password;

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    public static class GoogleLoginRequest {
        private String idToken;

        public String getIdToken() { return idToken; }
        public void setIdToken(String idToken) { this.idToken = idToken; }
    }

    public static class AuthResponse {
        private final User user;
        private final String token;

        public AuthResponse(User user, String token) {
            this.user = user;
            this.token = token;
        }

        public User getUser()    { return user; }
        public String getToken() { return token; }
    }

    public static class ResetPasswordRequest {
        @NotBlank @Email private String email;
        @NotBlank private String newPassword;
        @NotBlank private String oldPassword;

        public String getEmail()       { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getOldPassword() { return oldPassword; }
        public void setOldPassword(String oldPassword) { this.oldPassword = oldPassword; }
        public String getNewPassword() { return newPassword; }
        public void setNewPassword(String newPassword) { this.newPassword = newPassword; }
    }

    public static class ForceResetPasswordRequest {
        @NotBlank @Email private String email;
        @NotBlank private String newPassword;

        public String getEmail()       { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getNewPassword() { return newPassword; }
        public void setNewPassword(String newPassword) { this.newPassword = newPassword; }
    }
}
