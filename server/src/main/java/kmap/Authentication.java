package kmap;

import com.google.gson.*;
import org.apache.commons.io.IOUtils;

import javax.naming.*;
import javax.naming.directory.Attribute;
import javax.naming.directory.Attributes;
import javax.naming.directory.SearchControls;
import javax.naming.directory.SearchResult;
import javax.naming.ldap.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.*;
import java.util.stream.Collectors;

public class Authentication {
    private Properties properties;
    private Map<String, List<String>> groupConfig = new HashMap<>();
    private Map<String, Map<String, String>> csvs = new HashMap<>();

    public Authentication(Properties properties) {
        this.properties = properties;
        ExtendedTrustManager.getInstance(properties);

        String json = properties.getProperty("ldap.groups");
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
    }

    private Map<String, String> getCSV() {
        if (!csvs.containsKey(Server.CLIENT.get())) {
            Path path = Paths.get(properties.getProperty("ldap.csv") + Server.CLIENT.get() + "-users.csv");
            if (Files.exists(path)) {
                try {
                    Map<String, String> csv = Files.readAllLines(path).stream().map(l -> l.split(",")).collect(Collectors.toMap(s -> s[0], s -> s[1]));
                    csvs.put(Server.CLIENT.get(), csv);
                }
                catch (IOException e) {
                    e.printStackTrace();
                }
            }
            else
                csvs.put(Server.CLIENT.get(), null);
        }
        return csvs.get(Server.CLIENT.get());
    }

    private String getProperty(String key) {
        String value = properties.getProperty(key);
        if (value == null)
            System.err.println("WARNING: Property " + key + " is not configured");
        return value;
    }

    public boolean handle(HttpServletRequest request, HttpServletResponse response) throws IOException {
        System.out.println(request.getSession().getId());
        String login = request.getParameter("login");
        String logout = request.getParameter("logout");
        if (login != null) {
            login = login.toLowerCase();
            if ("POST".equals(request.getMethod())) {
                String json = IOUtils.toString(new InputStreamReader(request.getInputStream(), "UTF-8"));
                Gson gson = new GsonBuilder().create();
                JsonObject object = gson.fromJson(json, JsonObject.class);
                String password = object.getAsJsonPrimitive("password").getAsString();
                System.out.println("login = " + login + "/" + password);
                try {
                    Set<String> roles = authenticate(login, password);
                    if (roles != null) {
                        request.getSession().setAttribute("user", login);
                        request.getSession().setAttribute("roles", roles);
                        writeRoles(request, response, roles);
                    } else
                        writeResponse(request, response, "error", "invalid credentials");
                }
                catch (Exception e) {
                    sendError(request, response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, e.getMessage());
                }
            }
            else
                writeResponse(request, response, "error", "invalid login request");

            return false;
        }
        else if (logout != null) {
            logout = logout.toLowerCase();
            System.out.println("logout = " + logout);
            request.getSession().removeAttribute("user");
            request.getSession().invalidate();
            writeResponse(request, response, "info", "logged out");
            return false;
        }
        else if (request.getSession().getAttribute("user") != null) {
            return true;
        }
        else if (request.getSession().isNew()) {
            System.out.println("session new");
            sendError(request, response, HttpServletResponse.SC_UNAUTHORIZED, "session timeout");
            return false;
        }
        else {
            System.out.println("session not authenticated");
            sendError(request, response, HttpServletResponse.SC_FORBIDDEN, "session not authenticated");
            return false;
        }
    }

    private void sendError(HttpServletRequest request, HttpServletResponse response, int code, String message) throws IOException {
        JsonServlet.corsHeaders(request, response);
        response.sendError(code, message);
    }

    private void writeResponse(HttpServletRequest request, HttpServletResponse resp, String response, String message) throws IOException {
        JsonObject object = new JsonObject();
        object.addProperty("response", response);
        object.addProperty("message", message);
        writeObject(request, resp, object);
    }

    private void writeRoles(HttpServletRequest request, HttpServletResponse resp, Collection<String> roles) throws IOException {
        JsonArray array = new JsonArray();
        roles.forEach(array::add);
        JsonObject object = new JsonObject();
        object.addProperty("response", "data");
        object.add("data", array);
        writeObject(request, resp, object);
    }

    private void writeObject(HttpServletRequest request, HttpServletResponse resp, JsonObject object) throws IOException {
        resp.setContentType("application/json");
        resp.setCharacterEncoding("utf-8");
        JsonServlet.corsHeaders(request, resp);
        resp.getWriter().print(object.toString());
    }

    private Set<String> authenticate(String user, String password) {
        boolean authenticate = Boolean.valueOf(getProperty("ldap.authenticate"));
        if (!authenticate && "admin".equals(password)) {
            Set<String> roles = new HashSet<>();
            for (List<String> list : groupConfig.values()) {
                roles.addAll(list);
            }
            return roles;
        }
        Set<String> roles = null; // doauthenticate(user, password);
        Map<String, String> csv = getCSV();
        if (roles == null && csv != null) {
            roles = password.equals(csv.get(user)) ? Collections.singleton("student") : null;
        }
        return roles;
    }

    private Set<String> doauthenticate(String user, String password) {
        Hashtable<String, String> env = new Hashtable<String, String>();
        env.put(Context.INITIAL_CONTEXT_FACTORY, "com.sun.jndi.ldap.LdapCtxFactory");
        env.put("java.naming.ldap.version", "3");
        env.put(Context.PROVIDER_URL, getProperty("ldap.url"));
        env.put(Context.SECURITY_PRINCIPAL, user + "@" + getProperty("ldap.domain"));
        env.put(Context.SECURITY_CREDENTIALS, password);
        env.put(Context.SECURITY_AUTHENTICATION, "simple");

        try {
            InitialLdapContext context = new InitialLdapContext(env, null);

            Set<String> roles = new HashSet<>();
            roles.add("user");

            if (!groupConfig.isEmpty()) {
                String searchFilter = "(&(objectClass=User)(cn=" + user + "))";
                SearchControls searchControls = new SearchControls();
                searchControls.setReturningAttributes(new String[] { "memberof" });
                searchControls.setSearchScope(SearchControls.SUBTREE_SCOPE);
                searchControls.setCountLimit(2000);
                NamingEnumeration results = context.search(getProperty("ldap.userbase"), searchFilter, searchControls);
                while (results.hasMoreElements()) {
                    SearchResult searchResult = (SearchResult)results.nextElement();
                    Attributes attributes = searchResult.getAttributes();
                    List<String> groups = groups(attributes);
                    for (String group : groups) {
                        List<String> r = groupConfig.get(group);
                        if (r != null)
                            roles.addAll(r);
                    }
                    System.out.println("groups = " + groups);
                    System.out.println("roles = " + roles);
                }
            }
            context.close();
            return roles;
        }
        catch (AuthenticationException e) {
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
}
