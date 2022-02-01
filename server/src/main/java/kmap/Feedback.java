package kmap;

import com.google.gson.JsonObject;
import org.lightcouch.CouchDbClient;
import org.lightcouch.View;

import java.io.FileInputStream;
import java.io.IOException;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.stream.Collectors;

import static kmap.JSON.isNull;
import static kmap.JSON.string;

public class Feedback {
    private Couch couch;

    public Feedback(Couch couch) {
        this.couch = couch;
    }

    private CouchDbClient getClient() {
        return couch.createClient("feedback");
    }

    public synchronized void submit(String userid, String json) {
        CouchDbClient client = getClient();
        JsonObject object = client.getGson().fromJson(json, JsonObject.class);
        if (checks(object)) {
            object.addProperty("userid", userid);
            object.addProperty("state", "open");
            object.addProperty("timestamp", System.currentTimeMillis());
            client.save(object);
        }
        else {
            throw new RuntimeException("property missing");
        }
    }

    private boolean checks(JsonObject object) {
        return !isNull(object, "subject") && string(object, "subject") != null
                && !isNull(object, "chapter") && string(object, "chapter") != null
                && !isNull(object, "type") && string(object, "type") != null
                && !isNull(object, "title") && string(object, "title") != null
                && !isNull(object, "text") && string(object, "text") != null;
    }

    public synchronized void bug(String json) {
        CouchDbClient client = getClient();
        JsonObject object = client.getGson().fromJson(json, JsonObject.class);
        if (errorChecks(object)) {
            object.addProperty("type", "bug");
            object.addProperty("state", "open");
            object.addProperty("timestamp", System.currentTimeMillis());
            System.out.println(object);
        }
        else {
            throw new RuntimeException("property missing");
        }
    }

    private boolean errorChecks(JsonObject object) {
        return !isNull(object, "title") && string(object, "title") != null
                && !isNull(object, "text") && string(object, "text") != null;
    }

    public synchronized void resolve(String json) {
        CouchDbClient client = getClient();
        JsonObject object = client.getGson().fromJson(json, JsonObject.class);
        object.addProperty("state", "resolved");
        client.update(object);
    }

    public synchronized List<JsonObject> purge(String date, Set<String> types) {
        try {
            long time = new SimpleDateFormat("yyyy-MM-dd").parse(date).getTime();
            CouchDbClient client = getClient();
            for (String type : types) {
                View view = client.view("feedback/" + type + "sByTimestamp")
                        .startKey(0)
                        .endKey(time)
                        .reduce(false)
                        .includeDocs(true);
                List<JsonObject> objects = view.query(JsonObject.class);
                if (!objects.isEmpty()) {
                    for (JsonObject object : objects) {
                        object.addProperty("_deleted", true);
                    }
                    client.bulk(objects, true);
                }
            }
        }
        catch (ParseException e) {
            e.printStackTrace();
        }
        return load(null);
    }

    List<JsonObject> load(String state) {
        View view = getClient().view("_all_docs").includeDocs(true);
        List<JsonObject> objects = view.query(JsonObject.class).stream().filter(o -> "open".equals(string(o, "state"))).collect(Collectors.toList());
        if (objects.size() > 100)
            objects = objects.subList(0, 100);
        return objects;
    }

    public static void main(String[] args) throws IOException {
        Server.CLIENT.set("vu");
        Feedback feedback = new Feedback(new Couch(readProperties(args[0])));
        /*
        JsonObject object = new JsonObject();
        object.addProperty("subject", "Mathematik");
        object.addProperty("chapter", "Differentialrechnung");
        object.addProperty("topics", "Mittlere Änderungsrate");
        object.addProperty("type", "bug");
        object.addProperty("title", "Test");
        object.addProperty("text", "Hallo");
        feedback.submit("test", object.toString());
        System.out.println(feedback.load(""));
         */
        feedback.purge("2022-01-30", Set.of("bug"));
    }

    private static Properties readProperties(String fileName) throws IOException {
        Properties properties = new Properties();
        properties.load(new FileInputStream(fileName));
        return properties;
    }
}
