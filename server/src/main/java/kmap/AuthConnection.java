package kmap;

import com.google.gson.JsonObject;

import java.util.*;

import static java.util.Collections.EMPTY_LIST;

public abstract class AuthConnection {
    private static Map<String, AuthConnection> INSTANCES = new HashMap<>();

    public static synchronized AuthConnection get(Properties properties) {
        AuthConnection connection = INSTANCES.get(Server.CLIENT.get());
        if (connection == null) {
            properties = new Properties(properties);
            properties.putAll(Instances.get(properties).authconf());
            if ("paedml".equals(properties.get("auth.type"))) {
                System.out.println("New LDAPConnection\n" + properties.toString());
                connection = new PaedMLConnection(properties);
            }
            else if ("linuxmuster".equals(properties.get("auth.type"))) {
                System.out.println("New LinuxmusterConnection\n" + properties.toString());
                connection = new LinuxmusterConnection(properties);
            }
            else
                connection = new NoConnection();

            INSTANCES.put(Server.CLIENT.get(), connection);
        }
        return connection;
    }

    public static synchronized void kick() {
        INSTANCES.remove(Server.CLIENT.get());
    }

    abstract Set<String> doauthenticate(String user, String password);

    public abstract List<JsonObject> readStudents();

    public abstract List<JsonObject> readClasses();

    public abstract List<JsonObject> filterIdentities(String search);

    public abstract List<JsonObject> expandClass(String expand);


    private static class NoConnection extends AuthConnection {
        @Override
        Set<String> doauthenticate(String user, String password) {
            return null;
        }

        @Override
        public List<JsonObject> readStudents() {
            return EMPTY_LIST;
        }

        @Override
        public List<JsonObject> readClasses() {
            return EMPTY_LIST;
        }

        @Override
        public List<JsonObject> filterIdentities(String search) {
            return EMPTY_LIST;
        }

        @Override
        public List<JsonObject> expandClass(String expand) {
            return EMPTY_LIST;
        }
    }
}
