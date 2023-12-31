package kmap;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import com.google.gson.*;
import com.opencsv.CSVReader;
import org.apache.commons.io.IOUtils;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.*;

public class Authentication {
    private Properties properties;
    private Map<String, Map<String, Account>> csvs = new HashMap<>();

    public Authentication(Properties properties) {
        this.properties = properties;
        //ExtendedTrustManager.getInstance(properties);
    }

    private Map<String, Account> getCSV() {
        if (!csvs.containsKey(Server.CLIENT.get())) {
            Path path = Paths.get(properties.getProperty("auth.csv") + Server.CLIENT.get() + "-users.csv");
            if (Files.exists(path)) {
                System.out.println("instance csv: " + path + " - added");
                try {
                    CSVReader reader = new CSVReader(Files.newBufferedReader(path));
                    Map<String, Account> csv = new HashMap<>();
                    reader.forEach(line -> csv.put(line[0], new Account(line)));
                    csvs.put(Server.CLIENT.get(), csv);
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
            else {
                csvs.put(Server.CLIENT.get(), null);
                System.out.println("instance csv: " + path + " - does not exist");
            }
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
        String login = request.getParameter("login");
        String logout = request.getParameter("logout");
        if (login != null) {
            if ("POST".equals(request.getMethod())) {
                String json = IOUtils.toString(new InputStreamReader(request.getInputStream(), StandardCharsets.UTF_8));
                Gson gson = new GsonBuilder().create();
                JsonObject object = gson.fromJson(json, JsonObject.class);
                String password = object.getAsJsonPrimitive("password").getAsString();
                System.out.println("login = " + login);
                try {
                    Set<String> roles = authenticate(login, password);
                    if (roles != null) {
                        request.getSession().setAttribute("user", login);
                        request.getSession().setAttribute("roles", roles);
                        writeRoles(request, response, roles);
                    }
                    else
                        JsonServlet.sendError(request, response, HttpServletResponse.SC_NOT_ACCEPTABLE, "invalid credentials");
                }
                catch (Exception e) {
                    e.printStackTrace();
                    JsonServlet.sendError(request, response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, e.getMessage());
                }
            }
            else
                JsonServlet.sendError(request, response, HttpServletResponse.SC_NOT_ACCEPTABLE, "invalid login request");

            return false;
        }
        else if (logout != null) {
            logout = logout.toLowerCase();
            System.out.println("logout = " + logout);
            request.getSession().removeAttribute("user");
            request.getSession().invalidate();
            JsonServlet.writeResponse(request, response, new JsonPrimitive("logged out"));
            return false;
        }
        else if (request.getSession().getAttribute("user") != null) {
            return true;
        }
        else if (request.getSession().isNew()) {
            System.out.println("session new");
            JsonServlet.sendError(request, response, HttpServletResponse.SC_UNAUTHORIZED, "session timeout");
            return false;
        }
        else {
            System.out.println("session not authenticated");
            JsonServlet.sendError(request, response, HttpServletResponse.SC_UNAUTHORIZED, "session not authenticated");
            return false;
        }
    }

    private void writeRoles(HttpServletRequest request, HttpServletResponse resp, Collection<String> roles) throws IOException {
        JsonArray array = new JsonArray();
        roles.forEach(array::add);
        JsonServlet.writeResponse(request, resp, array);
    }

    private Set<String> authenticate(String user, String password) {
        boolean authenticate = Boolean.parseBoolean(getProperty("auth.authenticate"));
        if (!authenticate && "admin".equals(password)) {
            Set<String> roles = new HashSet<>();
            roles.add("user");
            roles.add("admin");
            roles.add("teacher");
            roles.add("student");
            return roles;
        }
        if ("root".equals(Server.CLIENT.get())) {
            Set<String> roles = verifyIdToken(user, password);
            Map<String, Account> csv = getCSV();
            Account account = csv.get(user);
            if (account != null)
                roles.addAll(account.roles);
            return roles;
        }
        else {
            AuthConnection connection = AuthConnection.get(properties);
            Set<String> roles = connection.doauthenticate(user, password);
            Map<String, Account> csv = getCSV();
            if (roles == null && csv != null) {
                Account account = csv.get(user);
                roles = account != null && account.match(password) ? account.roles : null;

                if (roles == null)
                    System.out.println("csv auth failed");
            }
            return roles;
        }
    }

    private Set<String> verifyIdToken(String user, String token) {
        try {
            FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(token);
            //System.out.println("uid = " + decodedToken.getUid());
            Set<String> roles = new HashSet<>(2);
            roles.add("user");
            roles.add("student");
            roles.add("displayName:" + decodedToken.getName());
            return roles;
        }
        catch (FirebaseAuthException e) {
            return null;
        }
    }

    void checkRole(HttpServletRequest request, String role) throws AuthException {
        HttpSession session = request.getSession();
        Object user = session.getAttribute("user");
        Set<String> roles = (Set<String>)session.getAttribute("roles");
        if (user == null || !roles.contains(role))
            throw new AuthException("teacher");
    }

    static class Account {
        String userid;
        String password;
        Set<String> roles;


        public Account(String[] cols) {
            this.userid = cols[0];
            this.password = cols[1];
            if (cols.length > 2)
                this.roles = new HashSet<>(Arrays.asList(Arrays.copyOfRange(cols, 2, cols.length)));
            else
                this.roles = Collections.singleton("student");
        }

        boolean match(String password) {
            return this.password.equals(password);
        }
    }

    static class AuthException extends Exception {
        public AuthException(String role) {
            super(role);
        }

        public String getMissingRole() {
            return getMessage();
        }
    }
}
