package kmap;

import com.google.gson.JsonObject;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.Sorts;
import com.mongodb.client.model.Updates;
import org.bson.Document;
import org.bson.conversions.Bson;

import java.io.FileInputStream;
import java.io.IOException;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.*;

import static kmap.JSON.*;

public class Feedback {
    private final Couch couch;
    private final MongoConnection connection;

    public Feedback(Couch couch) {
        this.couch = couch;
        this.connection = couch.getConnection();
    }

    private MongoCollection<Document> feedback() {
        return connection.getCollection("feedback");
    }

    private String instance() {
        return connection.getInstance();
    }

    public synchronized void submit(String userid, String json) {
        JsonObject object = MongoConnection.getGson().fromJson(json, JsonObject.class);
        if (checks(object)) {
            object.addProperty("userid", userid);
            object.addProperty("state", "open");
            object.addProperty("timestamp", System.currentTimeMillis());
            object.addProperty("instance", instance());
            object.addProperty("_id", instance() + ":" + UUID.randomUUID().toString().replace("-", ""));
            feedback().insertOne(MongoConnection.toDocument(object));
        }
        else {
            throw new RuntimeException("property missing");
        }
    }

    private boolean checks(JsonObject object) {
        return !isMissingOrNull(object, "subject")
                && !isMissingOrNull(object, "chapter")
                && !isMissingOrNull(object, "type")
                && !isMissingOrNull(object, "title")
                && !isMissingOrNull(object, "text");
    }

    public synchronized void bug(String json) {
        JsonObject object = MongoConnection.getGson().fromJson(json, JsonObject.class);
        if (errorChecks(object)) {
            object.addProperty("type", "bug");
            object.addProperty("state", "open");
            object.addProperty("timestamp", System.currentTimeMillis());
            object.addProperty("instance", instance());
            object.addProperty("_id", instance() + ":" + UUID.randomUUID().toString().replace("-", ""));
            feedback().insertOne(MongoConnection.toDocument(object));
            System.out.println(object);
        }
        else {
            throw new RuntimeException("property missing");
        }
    }

    private boolean errorChecks(JsonObject object) {
        return !isMissingOrNull(object, "title")
                && !isMissingOrNull(object, "text");
    }

    public synchronized void resolve(String json) {
        JsonObject object = MongoConnection.getGson().fromJson(json, JsonObject.class);
        String id = string(object, "_id");
        if (id != null) {
            feedback().updateOne(Filters.eq("_id", id), Updates.set("state", "resolved"));
        }
    }

    public synchronized List<JsonObject> purge(String date, Set<String> types) {
        try {
            long time = new SimpleDateFormat("yyyy-MM-dd").parse(date).getTime();
            Bson filter = Filters.and(
                Filters.eq("instance", instance()),
                Filters.in("type", types),
                Filters.lte("timestamp", time)
            );
            feedback().deleteMany(filter);
        }
        catch (ParseException e) {
            e.printStackTrace();
        }
        return load(null);
    }

    List<JsonObject> load(String state) {
        Bson filter = Filters.and(
            Filters.eq("instance", instance()),
            Filters.eq("state", "open")
        );
        List<JsonObject> list = new ArrayList<>();
        for (Document doc : feedback().find(filter).sort(Sorts.descending("timestamp")).limit(100)) {
            list.add(MongoConnection.toJsonObject(doc));
        }
        return list;
    }

    public static void main(String[] args) throws IOException {
        Server.CLIENT.set("vu");
        Feedback feedback = new Feedback(new Couch(readProperties(args[0])));
        feedback.purge("2022-01-30", Set.of("bug"));
    }

    private static Properties readProperties(String fileName) throws IOException {
        return Config.load(fileName);
    }
}
