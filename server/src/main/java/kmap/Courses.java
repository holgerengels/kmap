package kmap;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonPrimitive;
import org.lightcouch.CouchDbClient;
import org.lightcouch.NoDocumentException;
import org.lightcouch.View;

import java.io.FileInputStream;
import java.io.IOException;
import java.util.*;

import static kmap.JSON.*;

/**
 * Created by holger on 04.04.17.
 */
public class Courses {
    private States states;

    public Courses(States states) {
        this.states = states;
    }

    private CouchDbClient getClient() {
        return states.getCouch().createClient("course");
    }

    public JsonArray courses(String user) {
        CouchDbClient client = getClient();
        View view = client.view("course/byUser")
                .key(user)
                .reduce(false)
                .includeDocs(true);
        List<JsonObject> objects = view.query(JsonObject.class);
        return sortedArray(objects, "name");
    }

    public JsonObject course(String user, String name) {
        CouchDbClient client = getClient();
        View view = client.view("course/byName")
                .key(user, name)
                .reduce(false)
                .includeDocs(true);
        List<JsonObject> objects = view.query(JsonObject.class);
        return objects.size() == 1 ? objects.get(0) : null;
    }

    public void deleteCourse(String user, String json) {
        CouchDbClient client = getClient();
        JsonObject data = client.getGson().fromJson(json, JsonObject.class);
        String name = JSON.string(data, "name");
        View view = client.view("course/byName")
                .key(user, name)
                .reduce(false)
                .includeDocs(true);
        List<JsonObject> objects = view.query(JsonObject.class);
        JsonObject jsonObject = objects.get(0);
        jsonObject.addProperty("_deleted", true);
        client.update(jsonObject);
    }

    public void saveCourse(String user, String name, String json) {
        CouchDbClient client = getClient();
        JsonObject data = client.getGson().fromJson(json, JsonObject.class);
        try {
            JsonObject object = course(user, name);
            if (object != null) {
                object.add("students", data.getAsJsonArray("students"));
                object.add("curriculum", data.getAsJsonPrimitive("curriculum"));
                client.update(object);
            }
            else {
                object = data;
                object.addProperty("user", user);
                client.save(object);
            }
        }
        catch (NoDocumentException e) {
            System.out.println("WARNING: there should be a document = " + e);
            throw new RuntimeException(e);
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
}
