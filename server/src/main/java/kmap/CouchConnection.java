package kmap;

import org.lightcouch.CouchDbClient;
import org.lightcouch.CouchDbProperties;

import java.util.Properties;

public class CouchConnection {
    private Properties properties;
    private String host;
    private int port;
    private String username;
    private String password;

    public CouchConnection(Properties properties) {
        this.properties = properties;
        host = getProperty("kmap.host");
        port = Integer.parseInt(getProperty("kmap.port"));
        username = getProperty("kmap.user");
        password = getProperty("kmap.password");
    }

    public CouchDbClient createClient(String name) {
        CouchDbProperties couchProperties = new CouchDbProperties()
                .setDbName(Server.CLIENT.get() + "-" + name)
                .setCreateDbIfNotExist(false)
                .setProtocol("http")
                .setHost(host)
                .setPort(port)
                .setUsername(username)
                .setPassword(password)
                .setMaxConnections(10)
                .setConnectionTimeout(0);
        return new CouchDbClient(couchProperties);
    }

    protected String getProperty(String key) {
        String value = properties.getProperty(key);
        if (value == null)
            System.err.println("WARNING: Property " + key + " is not configured");
        return value;
    }
}
