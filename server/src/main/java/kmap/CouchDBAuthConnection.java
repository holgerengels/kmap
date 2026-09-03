package kmap;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import org.lightcouch.CouchDbClient;
import org.lightcouch.NoDocumentException;
import org.mindrot.jbcrypt.BCrypt;

import java.util.*;
import java.util.stream.Collectors;

public class CouchDBAuthConnection extends AuthConnection {
    private final CouchConnection connection;

    public CouchDBAuthConnection(Properties properties) {
        this.connection = new CouchConnection(properties);
    }

    private CouchDbClient authClient() {
        return connection.createClient("auth");
    }

    @Override
    Set<String> doauthenticate(String user, String password) {
        try {
            CouchDbClient client = authClient();
            JsonObject userDoc = client.find(JsonObject.class, "user:" + user);
            String hash = JSON.string(userDoc, "passwordHash");
            if (hash != null && BCrypt.checkpw(password, hash)) {
                Set<String> roles = new HashSet<>();
                roles.add("user");
                JsonArray rolesArray = userDoc.getAsJsonArray("roles");
                if (rolesArray != null) {
                    for (JsonElement role : rolesArray) {
                        roles.add(role.getAsString());
                    }
                }
                String displayName = JSON.string(userDoc, "displayName");
                if (displayName != null) {
                    roles.add("displayName:" + displayName);
                }
                return roles;
            }
            return null;
        } catch (NoDocumentException e) {
            return null;
        } catch (Exception e) {
            System.err.println("CouchDB auth error: " + e.getMessage());
            return null;
        }
    }

    public JsonObject register(String userid, String email, String password, String displayName) {
        CouchDbClient client = authClient();

        // Check if user already exists
        try {
            client.find(JsonObject.class, "user:" + userid);
            return null; // User already exists
        } catch (NoDocumentException ignored) {
            // Good, user does not exist
        }

        JsonObject userDoc = new JsonObject();
        userDoc.addProperty("_id", "user:" + userid);
        userDoc.addProperty("type", "user");
        userDoc.addProperty("userid", userid);
        userDoc.addProperty("email", email);
        userDoc.addProperty("passwordHash", BCrypt.hashpw(password, BCrypt.gensalt()));
        userDoc.addProperty("displayName", displayName);
        userDoc.addProperty("createdAt", new Date().toInstant().toString());
        JsonArray roles = new JsonArray();
        roles.add("user");
        roles.add("student");
        userDoc.add("roles", roles);

        client.save(userDoc);
        return userDoc;
    }

    public String createResetToken(String email) {
        CouchDbClient client = authClient();

        // Find user by email
        List<JsonObject> allDocs = client.view("_all_docs")
                .startKey("user:")
                .endKey("user:\ufff0")
                .includeDocs(true)
                .query(JsonObject.class);

        String userid = null;
        for (JsonObject doc : allDocs) {
            if (email.equals(JSON.string(doc, "email"))) {
                userid = JSON.string(doc, "userid");
                break;
            }
        }

        if (userid == null) return null;

        // Create reset token
        String token = UUID.randomUUID().toString();
        JsonObject tokenDoc = new JsonObject();
        tokenDoc.addProperty("_id", "reset:" + token);
        tokenDoc.addProperty("type", "reset-token");
        tokenDoc.addProperty("userid", userid);
        tokenDoc.addProperty("email", email);
        long expiresAt = System.currentTimeMillis() + 3600000; // 1 hour
        tokenDoc.addProperty("expiresAt", expiresAt);
        client.save(tokenDoc);

        return token;
    }

    public boolean resetPassword(String token, String newPassword) {
        CouchDbClient client = authClient();
        try {
            JsonObject tokenDoc = client.find(JsonObject.class, "reset:" + token);
            long expiresAt = tokenDoc.getAsJsonPrimitive("expiresAt").getAsLong();
            if (System.currentTimeMillis() > expiresAt) {
                client.remove(tokenDoc);
                return false;
            }

            String userid = JSON.string(tokenDoc, "userid");
            JsonObject userDoc = client.find(JsonObject.class, "user:" + userid);
            userDoc.addProperty("passwordHash", BCrypt.hashpw(newPassword, BCrypt.gensalt()));
            client.update(userDoc);
            client.remove(tokenDoc);
            return true;
        } catch (NoDocumentException e) {
            return false;
        }
    }

    public boolean changePassword(String userid, String oldPassword, String newPassword) {
        CouchDbClient client = authClient();
        try {
            JsonObject userDoc = client.find(JsonObject.class, "user:" + userid);
            String hash = JSON.string(userDoc, "passwordHash");
            if (hash == null || !BCrypt.checkpw(oldPassword, hash)) {
                return false;
            }
            userDoc.addProperty("passwordHash", BCrypt.hashpw(newPassword, BCrypt.gensalt()));
            client.update(userDoc);
            return true;
        } catch (NoDocumentException e) {
            return false;
        }
    }

    public void deleteUser(String userid) {
        CouchDbClient client = authClient();
        try {
            JsonObject userDoc = client.find(JsonObject.class, "user:" + userid);
            client.remove(userDoc);
        } catch (NoDocumentException ignored) {
        }
    }

    public List<JsonObject> listUsers() {
        CouchDbClient client = authClient();
        List<JsonObject> users = new ArrayList<>();
        List<JsonObject> allDocs = client.view("_all_docs")
                .startKey("user:")
                .endKey("user:\ufff0")
                .includeDocs(true)
                .query(JsonObject.class);

        for (JsonObject doc : allDocs) {
            JsonObject user = new JsonObject();
            user.addProperty("userid", JSON.string(doc, "userid"));
            user.addProperty("email", JSON.string(doc, "email"));
            user.addProperty("displayName", JSON.string(doc, "displayName"));
            user.add("roles", doc.getAsJsonArray("roles"));
            users.add(user);
        }
        return users;
    }

    public void updateUser(String userid, String email, String displayName, JsonArray roles) {
        CouchDbClient client = authClient();
        JsonObject userDoc = client.find(JsonObject.class, "user:" + userid);
        if (email != null) userDoc.addProperty("email", email);
        if (displayName != null) userDoc.addProperty("displayName", displayName);
        if (roles != null) userDoc.add("roles", roles);
        client.update(userDoc);
    }



    @Override
    public List<JsonObject> readStudents() {
        List<JsonObject> users = listUsers();
        return users.stream()
                .filter(u -> {
                    JsonArray roles = u.getAsJsonArray("roles");
                    if (roles == null) return false;
                    for (JsonElement r : roles) {
                        if ("student".equals(r.getAsString())) return true;
                    }
                    return false;
                })
                .map(u -> {
                    JsonObject student = new JsonObject();
                    student.addProperty("id", JSON.string(u, "userid"));
                    student.addProperty("name", JSON.string(u, "displayName"));
                    student.addProperty("clazz", "");
                    return student;
                })
                .collect(Collectors.toList());
    }

    @Override
    public List<JsonObject> readClasses() {
        return Collections.emptyList();
    }

    @Override
    public List<JsonObject> filterIdentities(String search) {
        String finalSearch = search.toLowerCase();
        return listUsers().stream()
                .filter(u -> {
                    String userid = JSON.string(u, "userid");
                    String name = JSON.string(u, "displayName");
                    return (userid != null && userid.toLowerCase().contains(finalSearch))
                            || (name != null && name.toLowerCase().contains(finalSearch));
                })
                .collect(Collectors.toList());
    }

    @Override
    public List<JsonObject> expandClass(String expand) {
        return Collections.emptyList();
    }
}
