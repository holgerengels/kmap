package kmap;

import com.google.gson.JsonObject;
import com.google.gson.JsonPrimitive;

public class JSON {
    public static boolean isNull(JsonObject topic, String name) {
        return topic.get(name).isJsonNull();
    }

    public static String string(JsonObject topic, String name) {
        JsonPrimitive primitive = topic.getAsJsonPrimitive(name);
        return primitive != null ? primitive.getAsString() : null;
    }

    public static Integer integer(JsonObject topic, String name) {
        JsonPrimitive primitive = topic.getAsJsonPrimitive(name);
        return primitive != null && primitive.getAsString().length() != 0 ? primitive.getAsInt() : null;
    }
}
