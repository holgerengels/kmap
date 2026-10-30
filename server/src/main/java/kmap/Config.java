package kmap;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Properties;

/**
 * Loads the server configuration from an external config.json that is neither part of git nor of the docker image.
 *
 * Lookup order for the config file:
 * <ol>
 *     <li>system property {@code kmap.config}</li>
 *     <li>environment variable {@code KMAP_CONFIG}</li>
 *     <li>{@code /config/config.json} (docker volume)</li>
 * </ol>
 *
 * The nested JSON object in section {@code "server"} is flattened to dotted keys, e.g.
 * {@code {"mongo": {"uri": "..."}}} becomes {@code mongo.uri}, so the rest of the code can keep using {@link Properties}.
 */
public final class Config {
    public static final String SYSTEM_PROPERTY = "kmap.config";
    public static final String ENVIRONMENT_VARIABLE = "KMAP_CONFIG";
    public static final String DEFAULT_PATH = "/config/config.json";
    public static final String SECTION = "server";

    private static Properties cached;

    private Config() {
    }

    /**
     * @return the configuration of this server, loaded once from the resolved config file
     */
    public static synchronized Properties get() throws IOException {
        if (cached == null) {
            Path path = resolve();
            System.out.println("Loading configuration from " + path);
            cached = load(path);
        }
        return cached;
    }

    static Path resolve() throws IOException {
        String location = System.getProperty(SYSTEM_PROPERTY);
        if (isBlank(location))
            location = System.getenv(ENVIRONMENT_VARIABLE);
        if (isBlank(location))
            location = DEFAULT_PATH;

        Path path = Paths.get(location);
        if (!Files.isRegularFile(path))
            throw new IOException("Configuration file " + path.toAbsolutePath() + " not found. "
                    + "Set -D" + SYSTEM_PROPERTY + "=... or " + ENVIRONMENT_VARIABLE + "=... or mount it as " + DEFAULT_PATH);
        return path;
    }

    /**
     * Loads a config.json (section "server" flattened) or, for command line tools, a legacy .properties file.
     */
    public static Properties load(String fileName) throws IOException {
        return load(Paths.get(fileName));
    }

    public static Properties load(Path path) throws IOException {
        Properties properties;
        if (path.getFileName().toString().endsWith(".json")) {
            try (Reader reader = Files.newBufferedReader(path, StandardCharsets.UTF_8)) {
                properties = fromJson(JsonParser.parseReader(reader));
            }
        }
        else {
            properties = new Properties();
            try (InputStream in = new FileInputStream(path.toFile())) {
                properties.load(in);
            }
        }

        Path dir = path.toAbsolutePath().getParent();
        properties.setProperty("config.dir", dir.toString());
        defaultPath(properties, "auth.csv", dir.toString() + "/");
        defaultPath(properties, "auth.trustStore", dir.resolve("trustStore").toString());
        return properties;
    }

    static Properties fromJson(JsonElement root) {
        if (root == null || !root.isJsonObject())
            throw new IllegalArgumentException("config.json must contain a JSON object");

        JsonObject object = root.getAsJsonObject();
        JsonElement section = object.get(SECTION);
        if (section != null) {
            if (!section.isJsonObject())
                throw new IllegalArgumentException("section '" + SECTION + "' in config.json must be a JSON object");
            object = section.getAsJsonObject();
        }

        Properties properties = new Properties();
        flatten("", object, properties);
        return properties;
    }

    private static void flatten(String prefix, JsonElement element, Properties properties) {
        if (element == null || element.isJsonNull())
            return;

        if (element.isJsonObject()) {
            for (var entry : element.getAsJsonObject().entrySet()) {
                String key = prefix.isEmpty() ? entry.getKey() : prefix + "." + entry.getKey();
                flatten(key, entry.getValue(), properties);
            }
        }
        else if (element.isJsonArray()) {
            JsonArray array = element.getAsJsonArray();
            StringBuilder builder = new StringBuilder();
            for (JsonElement item : array) {
                if (!item.isJsonPrimitive())
                    throw new IllegalArgumentException("only arrays of primitive values are supported (" + prefix + ")");
                if (builder.length() > 0)
                    builder.append(',');
                builder.append(item.getAsString());
            }
            properties.setProperty(prefix, builder.toString());
        }
        else {
            properties.setProperty(prefix, element.getAsString());
        }
    }

    private static void defaultPath(Properties properties, String key, String value) {
        if (isBlank(properties.getProperty(key)))
            properties.setProperty(key, value);
    }

    private static boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
