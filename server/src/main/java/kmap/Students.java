package kmap;

import com.google.gson.*;
import org.apache.commons.io.IOUtils;

import javax.naming.AuthenticationException;
import javax.naming.Context;
import javax.naming.NamingEnumeration;
import javax.naming.NamingException;
import javax.naming.directory.Attribute;
import javax.naming.directory.Attributes;
import javax.naming.directory.SearchControls;
import javax.naming.directory.SearchResult;
import javax.naming.ldap.*;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.*;
import java.util.function.Supplier;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.stream.Collector;
import java.util.stream.Collectors;

public class Students extends Server {
    private final String schuljahr;
    private String MEMBER_OF_CLASS = "G_Schueler_VBS_";

    private List<JsonObject> students;
    private List<JsonObject> classes;
    private long studentsExpire = 0;
    private long classesExpire = 0;
    private Map<String,String> studentNames = null;

    Supplier<LdapContext> ldapContext = () -> {
        try {
            ExtendedTrustManager.getInstance(properties);

            Hashtable<String, String> env = new Hashtable<String, String>();
            env.put(Context.INITIAL_CONTEXT_FACTORY, "com.sun.jndi.ldap.LdapCtxFactory");
            env.put("java.naming.ldap.version", "3");
            env.put(Context.PROVIDER_URL, getProperty("ldap.url"));
            env.put(Context.SECURITY_PRINCIPAL, getProperty("ldap.user"));
            env.put(Context.SECURITY_CREDENTIALS, getProperty("ldap.password"));
            env.put(Context.SECURITY_AUTHENTICATION, "simple");

            return new InitialLdapContext(env, null);
        }
        catch (NamingException e) {
            throw new RuntimeException(e);
        }
    };

    public Students(Properties properties) {
        super(properties);
        schuljahr = getProperty("ldap.schuljahr");
        ExtendedTrustManager.getInstance(properties);
    }

    protected String getProperty(String key) {
        String value = properties.getProperty(key);
        if (value == null)
            System.err.println("WARNING: Property " + key + " is not configured");
        return value;
    }

    public synchronized List<JsonObject> readStudents() {
        if (students != null && System.currentTimeMillis() - studentsExpire < 60000) {
            System.out.println("reuse students");
            return students;
        }

        LdapContext context;
        try {
            context = ldapContext.get();
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
                NamingEnumeration results = context.search(getProperty("ldap.userbase"), searchFilter, searchControls);

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
        Collections.sort(classes, Comparator.comparing(s -> s.getAsJsonPrimitive("id").getAsString()));
        return classes;
    }

    public synchronized List<JsonObject> filterIdentities(String search) {
        String finalSearch = search.toLowerCase();
        final List<JsonObject> objects = readStudents().stream()
            .filter(jsonObject -> jsonObject.getAsJsonPrimitive("id").getAsString().toLowerCase().contains(finalSearch)
                || jsonObject.getAsJsonPrimitive("name").getAsString().toLowerCase().contains(finalSearch)).collect(Collectors.toList());

        readClasses().stream()
            .filter(jsonObject -> jsonObject.getAsJsonPrimitive("id").getAsString().toLowerCase().contains(finalSearch))
            .forEach(jsonObject -> objects.add(jsonObject));

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

    public static void main(String[] args) throws IOException {
        Properties properties = new Properties();
        properties.load(new FileInputStream(args[0]));
        Students students = new Students(properties);
        System.out.println("objects = " + students.filterIdentities("va"));
        System.out.println("students.expandClass(\"GYM27G\") = " + students.expandClass("GYM27G"));
    }
}
