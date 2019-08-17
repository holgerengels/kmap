package kmap;

import java.io.FileInputStream;
import java.io.IOException;
import java.util.*;

/**
 * Created by holger on 14.05.16.
 */
public abstract class Server
{
    static ThreadLocal<String> CLIENT = new ThreadLocal<>();

    protected Properties properties;

    Server(Properties properties) {
        this.properties = properties;
    }

    private long millis = System.currentTimeMillis();

    public void start() {
        millis = System.currentTimeMillis();
    }

    protected void stop(String text) {
        System.out.println(getClass().getSimpleName() + " " + text + " " + (System.currentTimeMillis() - millis) + "ms");
        millis = System.currentTimeMillis();
    }

    public static Properties readProperties(String fileName) throws IOException {
        Properties properties = new Properties();
        properties.load(new FileInputStream(fileName));
        return properties;
    }

    protected String getProperty(String key) {
        String value = properties.getProperty(key);
        if (value == null)
            System.err.println("WARNING: Property " + key + " is not configured");
        return value;
    }
}
