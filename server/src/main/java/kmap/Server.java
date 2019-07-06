package kmap;

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
}
