package kmap;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.Updates;
import com.mongodb.client.result.UpdateResult;
import org.bson.Document;
import org.bson.conversions.Bson;
import org.mindrot.jbcrypt.BCrypt;

import java.util.*;
import java.util.stream.Collectors;

public class CouchDBAuthConnection extends AuthConnection {
    private final MongoConnection connection;

    public CouchDBAuthConnection(Properties properties) {
        this.connection = new MongoConnection(properties);
    }

    private MongoCollection<Document> users() {
        return connection.getCollection("users");
    }

    private String instance() {
        return connection.getInstance();
    }

    private boolean checkPassword(String plain, String hash) {
        if (hash == null) return false;
        if (hash.startsWith("$2b$") || hash.startsWith("$2y$")) {
            hash = "$2a$" + hash.substring(4);
        }
        return BCrypt.checkpw(plain, hash);
    }

    @Override
    Set<String> doauthenticate(String user, String password) {
        try {
            Document userDoc = users().find(Filters.or(
                Filters.eq("_id", instance() + ":user:" + user),
                Filters.and(Filters.eq("instance", instance()), Filters.eq("type", "user"), Filters.eq("userid", user))
            )).first();

            if (userDoc == null) {
                System.out.println("Mongo auth: user '" + user + "' not found in instance '" + instance() + "'");
                return null;
            }

            JsonObject userJson = MongoConnection.toJsonObject(userDoc);
            String hash = JSON.string(userJson, "passwordHash");
            if (hash == null) {
                System.out.println("Mongo auth: user '" + user + "' has no passwordHash");
                return null;
            }
            if (checkPassword(password, hash)) {
                Set<String> roles = new HashSet<>();
                roles.add("user");
                JsonArray rolesArray = userJson.getAsJsonArray("roles");
                if (rolesArray != null) {
                    for (JsonElement role : rolesArray) {
                        roles.add(role.getAsString());
                    }
                }
                String displayName = JSON.string(userJson, "displayName");
                if (displayName != null) {
                    roles.add("displayName:" + displayName);
                }
                System.out.println("Mongo auth: user '" + user + "' successfully authenticated with roles " + roles);
                return roles;
            }
            System.out.println("Mongo auth: password mismatch for user '" + user + "'");
            return null;
        } catch (Exception e) {
            System.err.println("Auth error: " + e.getMessage());
            return null;
        }
    }

    public JsonObject register(String userid, String email, String password, String displayName) {
        Document existing = users().find(Filters.or(
            Filters.eq("_id", instance() + ":user:" + userid),
            Filters.and(Filters.eq("instance", instance()), Filters.eq("type", "user"), Filters.eq("userid", userid))
        )).first();

        if (existing != null) {
            return null; // User already exists
        }

        JsonObject userDoc = new JsonObject();
        userDoc.addProperty("_id", instance() + ":user:" + userid);
        userDoc.addProperty("instance", instance());
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

        users().insertOne(MongoConnection.toDocument(userDoc));
        return userDoc;
    }

    public String createResetToken(String email) {
        Document userDoc = users().find(Filters.and(
            Filters.eq("instance", instance()),
            Filters.eq("type", "user"),
            Filters.eq("email", email)
        )).first();

        if (userDoc == null) return null;
        String userid = userDoc.getString("userid");
        if (userid == null) return null;

        String token = UUID.randomUUID().toString();
        JsonObject tokenDoc = new JsonObject();
        tokenDoc.addProperty("_id", instance() + ":reset:" + token);
        tokenDoc.addProperty("instance", instance());
        tokenDoc.addProperty("type", "reset-token");
        tokenDoc.addProperty("userid", userid);
        tokenDoc.addProperty("email", email);
        long expiresAt = System.currentTimeMillis() + 3600000; // 1 hour
        tokenDoc.addProperty("expiresAt", expiresAt);
        users().insertOne(MongoConnection.toDocument(tokenDoc));

        return token;
    }

    public boolean resetPassword(String token, String newPassword) {
        try {
            Document tokenDoc = users().find(Filters.eq("_id", instance() + ":reset:" + token)).first();
            if (tokenDoc == null) return false;

            Long expiresAt = tokenDoc.getLong("expiresAt");
            if (expiresAt != null && System.currentTimeMillis() > expiresAt) {
                users().deleteOne(Filters.eq("_id", instance() + ":reset:" + token));
                return false;
            }

            String userid = tokenDoc.getString("userid");
            users().updateOne(
                Filters.eq("_id", instance() + ":user:" + userid),
                Updates.set("passwordHash", BCrypt.hashpw(newPassword, BCrypt.gensalt()))
            );
            users().deleteOne(Filters.eq("_id", instance() + ":reset:" + token));
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public boolean changePassword(String userid, String newPassword) {
        try {
            UpdateResult res = users().updateOne(
                Filters.eq("_id", instance() + ":user:" + userid),
                Updates.set("passwordHash", BCrypt.hashpw(newPassword, BCrypt.gensalt()))
            );
            return res.getMatchedCount() > 0;
        } catch (Exception e) {
            return false;
        }
    }

    public void deleteUser(String userid) {
        users().deleteOne(Filters.eq("_id", instance() + ":user:" + userid));
    }

    public List<JsonObject> listUsers() {
        List<JsonObject> usersList = new ArrayList<>();
        Bson filter = Filters.and(
            Filters.eq("instance", instance()),
            Filters.eq("type", "user")
        );
        for (Document doc : users().find(filter)) {
            JsonObject user = new JsonObject();
            user.addProperty("userid", doc.getString("userid"));
            user.addProperty("email", doc.getString("email"));
            user.addProperty("displayName", doc.getString("displayName"));
            JsonObject jsonDoc = MongoConnection.toJsonObject(doc);
            user.add("roles", jsonDoc.getAsJsonArray("roles"));
            usersList.add(user);
        }
        return usersList;
    }

    public void updateUser(String userid, String email, String displayName, JsonArray roles) {
        List<Bson> updates = new ArrayList<>();
        if (email != null) updates.add(Updates.set("email", email));
        if (displayName != null) updates.add(Updates.set("displayName", displayName));
        if (roles != null) {
            List<String> rolesList = new ArrayList<>();
            roles.forEach(r -> rolesList.add(r.getAsString()));
            updates.add(Updates.set("roles", rolesList));
        }
        if (!updates.isEmpty()) {
            users().updateOne(
                Filters.eq("_id", instance() + ":user:" + userid),
                Updates.combine(updates)
            );
        }
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
