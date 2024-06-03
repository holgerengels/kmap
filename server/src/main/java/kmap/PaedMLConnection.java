package kmap;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

import javax.naming.AuthenticationException;
import javax.naming.Context;
import javax.naming.NamingEnumeration;
import javax.naming.NamingException;
import javax.naming.directory.Attribute;
import javax.naming.directory.Attributes;
import javax.naming.directory.SearchControls;
import javax.naming.directory.SearchResult;
import javax.naming.ldap.*;
import javax.net.ssl.SSLSocket;
import javax.net.ssl.SSLSocketFactory;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URL;
import java.util.*;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.stream.Collectors;

public class PaedMLConnection
        extends AuthConnection
{
    private Properties properties;
    private final Hashtable<String, String> env = new Hashtable<>();
    //private Map<String, List<String>> groupConfig = new HashMap<>();

    private List<JsonObject> students;
    private List<JsonObject> classes;
    private long studentsExpire = 0;
    private long classesExpire = 0;
    private Map<String,String> studentNames = null;


    public PaedMLConnection(Properties properties) {
        this.properties = properties;
        /*
        String json = properties.getProperty("paedml.groups");
        if (json != null) {
            Gson gson = new GsonBuilder().create();
            JsonObject object = gson.fromJson(json, JsonObject.class);
            for (Map.Entry<String, JsonElement> entry : object.entrySet()) {
                String string = entry.getValue().getAsString();
                String[] strings = string.split(",");
                for (String group : strings) {
                    groupConfig.computeIfAbsent(group, k -> new ArrayList<>()).add(entry.getKey());
                }
            }
            System.out.println(groupConfig);
        }
         */

        env.put(Context.INITIAL_CONTEXT_FACTORY, "com.sun.jndi.ldap.LdapCtxFactory");
        env.put("java.naming.ldap.version", "3");
        env.put(Context.PROVIDER_URL, getProperty("paedml.url"));
        env.put(Context.SECURITY_AUTHENTICATION, "simple");

        testSSLConnection();
    }

    private LdapContext authContext(String user, String password) throws NamingException {
        user = user + "@" + getProperty("paedml.domain");
        return context(user, password);
    }
    private LdapContext adminContext() throws NamingException {
        String user = getProperty("paedml.user");
        String password = getProperty("paedml.password");
        return context(user, password);
    }
    private LdapContext context(String user, String password) throws NamingException {
        Hashtable env = new Hashtable();
        env.putAll(this.env);
        env.put(Context.SECURITY_PRINCIPAL, user);
        env.put(Context.SECURITY_CREDENTIALS, password);
        return new InitialLdapContext(env, null);
    }

    @Override
    Set<String> doauthenticate(String user, String password) {
        try {
            LdapContext context = authContext(user, password);

            Set<String> roles = new HashSet<>();
            roles.add("user");

            String searchFilter = "(&(objectClass=User)(cn=" + user + "))";
            SearchControls searchControls = new SearchControls();
            searchControls.setReturningAttributes(new String[] { "employeeType" });
            searchControls.setSearchScope(SearchControls.SUBTREE_SCOPE);
            searchControls.setCountLimit(10);
            NamingEnumeration results = context.search(getProperty("paedml.userbase"), searchFilter, searchControls);
            if (results.hasMoreElements()) {
                SearchResult searchResult = (SearchResult)results.nextElement();
                Attributes attributes = searchResult.getAttributes();
                roles.add(teacherOrStudent(attributes));
            }
            if (results.hasMoreElements())
                throw new RuntimeException("Häh?");

            /*
            if (!groupConfig.isEmpty()) {
                String searchFilter = "(&(objectClass=User)(cn=" + user + "))";
                SearchControls searchControls = new SearchControls();
                searchControls.setReturningAttributes(new String[] { "memberof", "displayName" });
                searchControls.setSearchScope(SearchControls.SUBTREE_SCOPE);
                searchControls.setCountLimit(2000);
                NamingEnumeration results = context.search(getProperty("paedml.userbase"), searchFilter, searchControls);
                while (results.hasMoreElements()) {
                    SearchResult searchResult = (SearchResult)results.nextElement();
                    Attributes attributes = searchResult.getAttributes();
                    List<String> groups = groups(attributes);
                    for (String group : groups) {
                        List<String> r = groupConfig.get(group);
                        if (r != null)
                            roles.addAll(r);
                    }
                    roles.add("displayName:" + name(attributes));

                    //System.out.println("groups = " + groups);
                    //System.out.println("roles = " + roles);
                }
            }
             */
            context.close();
            return roles;
        }
        catch (AuthenticationException e) {
            System.out.println("ldap auth failed");
            return null;
        }
        catch (NamingException e) {
            throw new RuntimeException(e);
        }
    }
    private List<String> groups(Attributes attributes) throws NamingException {
        List<String> groups = new ArrayList<String>();
        Attribute attribute = attributes.get("memberof");
        NamingEnumeration<?> enumeration = attribute.getAll();
        while (enumeration.hasMoreElements()) {
            String value = (String)enumeration.nextElement();
            int index = value.indexOf(',');
            groups.add(value.substring("CN=".length(), index));
        }
        return groups;
    }

    private String name(Attributes attributes) throws NamingException {
        Attribute attribute = attributes.get("displayName");
        return (String)attribute.get();
    }

    private String teacherOrStudent(Attributes attributes) throws NamingException {
        Attribute attribute = attributes.get("employeeType");
        return ((String)attribute.get()).toLowerCase();
    }

    @Override
    public synchronized List<JsonObject> readStudents() {
        if (students != null && System.currentTimeMillis() - studentsExpire < 60000) {
            System.out.println("reuse students");
            return students;
        }

        LdapContext context;
        try {
            context = adminContext();
            context.setRequestControls(new Control[]{ new PagedResultsControl(100, false) });
            String searchFilter = "(&(objectClass=User)(employeeType=Student))";

            SearchControls searchControls = new SearchControls();
            String[] resultAttributes = { "cn", "sn", "givenName", "department" };
            searchControls.setReturningAttributes(resultAttributes);
            searchControls.setSearchScope(SearchControls.SUBTREE_SCOPE);
            searchControls.setCountLimit(2000);

            students = new ArrayList<>();
            studentNames = null;

            byte[] b = null;
            do {
                NamingEnumeration results = context.search(getProperty("paedml.userbase"), searchFilter, searchControls);

                if (results != null) {
                    while (results.hasMoreElements()) {
                        SearchResult searchResult = (SearchResult)results.nextElement();
                        Attributes attributes = searchResult.getAttributes();
                        //System.out.println("attributes = " + attributes);
                        String cn = attribute(attributes, "cn");
                        String givenname = attribute(attributes, "givenname");
                        String sn = attribute(attributes, "sn");
                        String department = attribute(attributes, "department");
                        if (cn == null || givenname == null || sn == null)
                            continue;

                        JsonObject student = new JsonObject();
                        student.addProperty("id", cn);
                        student.addProperty("name", givenname + " " + sn);
                        student.addProperty("clazz", department);
                        students.add(student);
                    }
                }
                else
                    System.out.println("did not match with any!!!");

                b = ((PagedResultsResponseControl)context.getResponseControls()[0]).getCookie();

                if (b != null) {
                    System.out.println("--------NEW PAGE----------");
                    context.setRequestControls(new Control[]{ new PagedResultsControl(100, b, Control.CRITICAL) });
                }

            } while (b != null);

            context.close();
            studentsExpire = System.currentTimeMillis();
            Collections.sort(students, Comparator.comparing(s -> s.getAsJsonPrimitive("id").getAsString()));
            return students;
        }
        catch (NamingException | IOException e) {
            Logger.getLogger(getClass().getSimpleName()).log(Level.SEVERE, e.getMessage(), e);
            return new ArrayList<>();
        }
    }

    @Override
    public synchronized List<JsonObject> readClasses() {
        if (classes != null && System.currentTimeMillis() - classesExpire < 60000) {
            System.out.println("reuse classes");
            return classes;
        }

        List<JsonObject> students = readStudents();
        Set<String> lala = new HashSet<>();
        students.forEach(student -> lala.add(student.getAsJsonPrimitive("clazz").getAsString()));

        classes = new ArrayList<>();
        lala.forEach(name -> {
            JsonObject group = new JsonObject();
            group.addProperty("id", name);
            group.addProperty("name", name);
            classes.add(group);
        });

        classesExpire = System.currentTimeMillis();
        classes.sort(Comparator.comparing(s -> s.getAsJsonPrimitive("id").getAsString()));
        return classes;
    }

    @Override
    public synchronized List<JsonObject> filterIdentities(String search) {
        String finalSearch = search.toLowerCase();
        final List<JsonObject> objects = readStudents().stream()
                .filter(jsonObject -> jsonObject.getAsJsonPrimitive("id").getAsString().toLowerCase().contains(finalSearch)
                        || jsonObject.getAsJsonPrimitive("name").getAsString().toLowerCase().contains(finalSearch)).collect(Collectors.toList());

        readClasses().stream()
                .filter(jsonObject -> jsonObject.getAsJsonPrimitive("id").getAsString().toLowerCase().contains(finalSearch))
                .forEach(objects::add);

        return objects;
    }

    public synchronized List<JsonObject> expandClass(String clazz) {
        List<JsonObject> students = readStudents();
        return students.stream().filter(student -> clazz.equals(student.getAsJsonPrimitive("clazz").getAsString())).collect(Collectors.toList());
    }

    private String attribute(Attributes attributes, String id) throws NamingException {
        Attribute attribute = attributes.get(id);
        return attribute != null ? (String) attribute.get() : null;
    }

    private String getProperty(String key) {
        String value = properties.getProperty(key);
        if (value == null)
            System.err.println("WARNING: Property " + key + " is not configured");
        return value;
    }

    public static void main(String[] args) throws IOException {
        System.out.println("args = " + Arrays.asList(args));
        Properties properties = new Properties();
        properties.load(new FileInputStream(args[0]));
        //ExtendedTrustManager.getInstance(properties);
        PaedMLConnection connection = new PaedMLConnection(properties);
        Set<String> roles = connection.doauthenticate(properties.getProperty("paedml.testuser"), properties.getProperty("paedml.testpassword"));
        System.out.println("roles = " + roles);
        List<JsonObject> students = connection.readStudents();
        System.out.println("students = " + students);
        List<JsonObject> classes = connection.readClasses();
        System.out.println("classes = " + classes);
        List<JsonObject> filtered = connection.filterIdentities("ab");
        System.out.println("filtered = " + filtered);
        List<JsonObject> clazz = connection.expandClass("GYM02E");
        System.out.println("clazz = " + clazz);
    }

    void testSSLConnection() {
        try {
            String url = getProperty("paedml.url");
            if (url.startsWith("ldaps://")) {
                url = url.substring("ldaps://".length());
                int pos = url.indexOf(":");
                String host = url.substring(0, pos);
                String port = url.substring(pos + 1);
                System.out.println("host = " + host);
                System.out.println("port = " + port);
                System.out.println("trustStore = " + System.getProperty("javax.net.ssl.trustStore"));
                // echo -n | openssl s_client -connect 192.168.1.225:636 | sed -ne '/-BEGIN CERTIFICATE-/,/-END CERTIFICATE-/p' > ldapserver.pem

                SSLSocketFactory sslsocketfactory = (SSLSocketFactory) SSLSocketFactory.getDefault();
                InputStream in;
                OutputStream out;
                try (SSLSocket sslsocket = (SSLSocket) sslsocketfactory.createSocket(host, Integer.parseInt(port))) {
                    in = sslsocket.getInputStream();
                    out = sslsocket.getOutputStream();
                    out.write(1);
                }
                while (in.available() > 0) {
                    System.out.print(in.read());
                }
                System.out.println("Successfully connected");
            }
        } catch (Exception exception) {
            exception.printStackTrace();
        }
    }
}
