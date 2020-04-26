package kmap;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;

import java.io.InputStream;

public class FirebaseInitializer {
    static FirebaseOptions OPTIONS;

    public static synchronized void init(InputStream serviceAccountKey) {
        if (OPTIONS == null) {
            try {
                OPTIONS = new FirebaseOptions.Builder()
                        .setCredentials(GoogleCredentials.fromStream(serviceAccountKey))
                        .setDatabaseUrl("https://kmap-753c2.firebaseio.com")
                        .build();

                FirebaseApp.initializeApp(OPTIONS);
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        }
    }
}
