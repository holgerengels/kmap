package kmap;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.Sorts;
import org.bson.Document;
import org.bson.conversions.Bson;

import java.io.FileInputStream;
import java.io.IOException;
import java.util.*;

import static kmap.JSON.*;
import static kmap.Server.readProperties;

/**
 * Created by holger on 04.04.17.
 * Refactored to MongoDB backend.
 */
public class Courses {
    private final States states;
    private final MongoConnection connection;

    public Courses(States states) {
        this.states = states;
        this.connection = states.getCouch().getConnection();
    }

    private MongoCollection<Document> courses() {
        return connection.getCollection("courses");
    }

    private String instance() {
        return connection.getInstance();
    }

    public JsonArray courses(String user) {
        Bson filter = Filters.and(
            Filters.eq("instance", instance()),
            Filters.eq("user", user)
        );
        List<JsonObject> objects = new ArrayList<>();
        for (Document doc : courses().find(filter).sort(Sorts.ascending("name"))) {
            objects.add(MongoConnection.toJsonObject(doc));
        }
        return toArray(objects);
    }

    public JsonArray timelines(String user) {
        Bson filter = Filters.and(
            Filters.eq("instance", instance()),
            Filters.exists("subject"),
            Filters.exists("curriculum"),
            Filters.exists("students"),
            Filters.or(
                Filters.eq("user", user),
                Filters.eq("students", user)
            )
        );
        List<JsonObject> objects = new ArrayList<>();
        for (Document doc : courses().find(filter).sort(Sorts.ascending("name"))) {
            objects.add(MongoConnection.toJsonObject(doc));
        }
        return toArray(objects);
    }

    public JsonObject course(String user, String name) {
        Bson filter = Filters.and(
            Filters.eq("instance", instance()),
            Filters.eq("user", user),
            Filters.eq("name", name)
        );
        Document doc = courses().find(filter).first();
        return doc != null ? MongoConnection.toJsonObject(doc) : null;
    }

    public void deleteCourse(String user, String json) {
        JsonObject data = MongoConnection.getGson().fromJson(json, JsonObject.class);
        String name = JSON.string(data, "name");
        Bson filter = Filters.and(
            Filters.eq("instance", instance()),
            Filters.eq("user", user),
            Filters.eq("name", name)
        );
        courses().deleteOne(filter);
    }

    public void saveCourse(String user, String name, String json) {
        JsonObject data = MongoConnection.getGson().fromJson(json, JsonObject.class);
        Bson filter = Filters.and(
            Filters.eq("instance", instance()),
            Filters.eq("user", user),
            Filters.eq("name", name)
        );
        Document existing = courses().find(filter).first();
        if (existing != null) {
            JsonObject object = MongoConnection.toJsonObject(existing);
            object.add("students", data.getAsJsonArray("students"));
            object.add("curriculum", data.getAsJsonPrimitive("curriculum"));
            courses().replaceOne(filter, MongoConnection.toDocument(object));
        }
        else {
            JsonObject object = data;
            object.addProperty("instance", instance());
            object.addProperty("user", user);
            object.addProperty("_id", instance() + ":" + UUID.randomUUID().toString().replace("-", ""));
            courses().insertOne(MongoConnection.toDocument(object));
        }
    }

    public synchronized JsonObject courseStates(String user, String course, String subject) {
        Map<String, Couch.WeightedSum> map = new HashMap<>();
        JsonObject object = course(user, course);
        JsonArray array = object.getAsJsonArray("students");
        for (JsonElement element : array) {
            JsonObject studentStates = states.states(element.getAsString(), subject);
            studentStates.remove("_id");
            studentStates.remove("_rev");
            studentStates.entrySet().forEach(entry -> map.merge(entry.getKey(), new Couch.WeightedSum(entry.getValue().getAsInt()), Couch.WeightedSum::add));
        }

        JsonObject courseStates = new JsonObject();
        courseStates.addProperty("@", array.size());

        for (Map.Entry<String, Couch.WeightedSum> entry : map.entrySet()) {
            String topic = entry.getKey();
            Couch.WeightedSum weightedSum = entry.getValue();
            courseStates.addProperty(topic, Math.round(weightedSum.average()));
            courseStates.addProperty(topic + "*", weightedSum.getCount());
        }
        states.averageAndProgress(courseStates, subject);

        return courseStates;
    }

    public static void main(String[] args) throws IOException {
        Courses courses = new Courses(new States(new Couch(readProperties(args[0]))));
        Server.CLIENT.set("vu");

        JsonArray jsonElements = courses.timelines("lala");
        System.out.println("jsonElements = " + jsonElements);
    }
}
