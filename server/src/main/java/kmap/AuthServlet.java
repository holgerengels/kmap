package kmap;

import com.google.gson.*;
import org.apache.commons.io.IOUtils;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Set;

/**
 * AuthServlet handles all authentication-related endpoints under /auth.
 * Replaces the login/logout functionality previously in StateServlet.
 */
public class AuthServlet extends JsonServlet {
    private MailService mailService;

    @Override
    public void init() throws ServletException {
        super.init();
        mailService = new MailService(properties);
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) {
        try {
            Server.CLIENT.set(extractClient(req));

            String login = req.getParameter("login");
            String logout = req.getParameter("logout");
            String register = req.getParameter("register");
            String resetPassword = req.getParameter("reset-password");
            String resetPasswordConfirm = req.getParameter("reset-password-confirm");
            String changePassword = req.getParameter("change-password");
            String deleteAccount = req.getParameter("delete-account");
            String createUser = req.getParameter("create-user");
            String editUser = req.getParameter("edit-user");
            String deleteUser = req.getParameter("delete-user");
            String resetUserPassword = req.getParameter("reset-user-password");

            if (login != null) {
                // Login — delegates to Authentication.handle()
                authentication.handle(req, resp);
            }
            else if (logout != null) {
                // Logout
                logout = logout.toLowerCase();
                System.out.println("logout = " + logout);
                req.getSession().removeAttribute("user");
                req.getSession().invalidate();
                writeResponse(req, resp, new JsonPrimitive("logged out"));
            }
            else if (register != null) {
                handleRegister(req, resp);
            }
            else if (resetPassword != null) {
                handleResetPassword(req, resp);
            }
            else if (resetPasswordConfirm != null) {
                handleResetPasswordConfirm(req, resp);
            }
            else if (changePassword != null) {
                handleChangePassword(req, resp);
            }
            else if (deleteAccount != null) {
                handleDeleteAccount(req, resp);
            }
            else if (createUser != null) {
                handleCreateUser(req, resp);
            }
            else if (editUser != null) {
                handleEditUser(req, resp, editUser);
            }
            else if (deleteUser != null) {
                handleDeleteUser(req, resp, deleteUser);
            }
            else if (resetUserPassword != null) {
                handleResetUserPassword(req, resp, resetUserPassword);
            }
            else {
                sendError(req, resp, HttpServletResponse.SC_BAD_REQUEST, "unknown auth request");
            }
        }
        catch (Authentication.AuthException e) {
            sendError(req, resp, HttpServletResponse.SC_FORBIDDEN, e.getMissingRole());
        }
        catch (Exception e) {
            e.printStackTrace();
            sendError(req, resp, e);
        }
        finally {
            Server.CLIENT.remove();
        }
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) {
        try {
            Server.CLIENT.set(extractClient(req));

            String users = req.getParameter("users");
            if (users != null) {
                handleListUsers(req, resp);
            }
            else {
                sendError(req, resp, HttpServletResponse.SC_BAD_REQUEST, "unknown auth request");
            }
        }
        catch (Authentication.AuthException e) {
            sendError(req, resp, HttpServletResponse.SC_FORBIDDEN, e.getMissingRole());
        }
        catch (Exception e) {
            e.printStackTrace();
            sendError(req, resp, e);
        }
        finally {
            Server.CLIENT.remove();
        }
    }

    private CouchDBAuthConnection getCouchDBConnection() {
        AuthConnection connection = AuthConnection.get(properties);
        if (connection instanceof CouchDBAuthConnection) {
            return (CouchDBAuthConnection) connection;
        }
        return null;
    }

    private void handleRegister(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        CouchDBAuthConnection couchDB = getCouchDBConnection();
        if (couchDB == null) {
            sendError(req, resp, HttpServletResponse.SC_BAD_REQUEST, "Registration ist f\u00fcr diese Instanz nicht verf\u00fcgbar");
            return;
        }

        String json = IOUtils.toString(new InputStreamReader(req.getInputStream(), StandardCharsets.UTF_8));
        JsonObject object = new Gson().fromJson(json, JsonObject.class);
        String userid = JSON.string(object, "userid");
        String email = JSON.string(object, "email");
        String password = JSON.string(object, "password");
        String displayName = JSON.string(object, "displayName");

        if (userid == null || email == null || password == null) {
            sendError(req, resp, HttpServletResponse.SC_BAD_REQUEST, "userid, email und password sind erforderlich");
            return;
        }

        if (displayName == null) displayName = userid;

        JsonObject result = couchDB.register(userid, email, password, displayName);
        if (result != null) {
            writeResponse(req, resp, new JsonPrimitive("registered"));
        } else {
            sendError(req, resp, HttpServletResponse.SC_CONFLICT, "Benutzer existiert bereits");
        }
    }

    private void handleResetPassword(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        CouchDBAuthConnection couchDB = getCouchDBConnection();
        if (couchDB == null) {
            sendError(req, resp, HttpServletResponse.SC_BAD_REQUEST, "Passwort-Reset ist f\u00fcr diese Instanz nicht verf\u00fcgbar");
            return;
        }

        String json = IOUtils.toString(new InputStreamReader(req.getInputStream(), StandardCharsets.UTF_8));
        JsonObject object = new Gson().fromJson(json, JsonObject.class);
        String email = JSON.string(object, "email");

        if (email == null) {
            sendError(req, resp, HttpServletResponse.SC_BAD_REQUEST, "email ist erforderlich");
            return;
        }

        String token = couchDB.createResetToken(email);
        if (token != null) {
            mailService.sendPasswordResetMail(email, token, Server.CLIENT.get());
        }
        // Always return success to not leak whether email exists
        writeResponse(req, resp, new JsonPrimitive("Wenn die E-Mail-Adresse registriert ist, erh\u00e4ltst du eine E-Mail mit einem Link zum Zur\u00fccksetzen."));
    }

    private void handleResetPasswordConfirm(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        CouchDBAuthConnection couchDB = getCouchDBConnection();
        if (couchDB == null) {
            sendError(req, resp, HttpServletResponse.SC_BAD_REQUEST, "Passwort-Reset ist f\u00fcr diese Instanz nicht verf\u00fcgbar");
            return;
        }

        String json = IOUtils.toString(new InputStreamReader(req.getInputStream(), StandardCharsets.UTF_8));
        JsonObject object = new Gson().fromJson(json, JsonObject.class);
        String token = JSON.string(object, "token");
        String newPassword = JSON.string(object, "password");

        if (token == null || newPassword == null) {
            sendError(req, resp, HttpServletResponse.SC_BAD_REQUEST, "token und password sind erforderlich");
            return;
        }

        if (couchDB.resetPassword(token, newPassword)) {
            writeResponse(req, resp, new JsonPrimitive("Passwort wurde ge\u00e4ndert"));
        } else {
            sendError(req, resp, HttpServletResponse.SC_BAD_REQUEST, "Ung\u00fcltiger oder abgelaufener Token");
        }
    }

    private void handleChangePassword(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        if (!authentication.handle(req, resp)) return;

        CouchDBAuthConnection couchDB = getCouchDBConnection();
        if (couchDB == null) {
            sendError(req, resp, HttpServletResponse.SC_BAD_REQUEST, "Passwort\u00e4nderung ist f\u00fcr diese Instanz nicht verf\u00fcgbar");
            return;
        }

        String userid = (String) req.getSession().getAttribute("user");
        String json = IOUtils.toString(new InputStreamReader(req.getInputStream(), StandardCharsets.UTF_8));
        JsonObject object = new Gson().fromJson(json, JsonObject.class);
        String oldPassword = JSON.string(object, "oldPassword");
        String newPassword = JSON.string(object, "newPassword");

        if (oldPassword == null || newPassword == null) {
            sendError(req, resp, HttpServletResponse.SC_BAD_REQUEST, "oldPassword und newPassword sind erforderlich");
            return;
        }

        if (couchDB.changePassword(userid, oldPassword, newPassword)) {
            writeResponse(req, resp, new JsonPrimitive("Passwort wurde ge\u00e4ndert"));
        } else {
            sendError(req, resp, HttpServletResponse.SC_BAD_REQUEST, "Altes Passwort ist falsch");
        }
    }

    private void handleDeleteAccount(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        if (!authentication.handle(req, resp)) return;

        String userid = (String) req.getSession().getAttribute("user");

        // Delete user data (states)
        // States deletion is handled by the existing delete mechanism

        // Delete CouchDB account if this is a CouchDB instance
        CouchDBAuthConnection couchDB = getCouchDBConnection();
        if (couchDB != null) {
            couchDB.deleteUser(userid);
        }

        req.getSession().removeAttribute("user");
        req.getSession().invalidate();
        writeResponse(req, resp, new JsonPrimitive("Account gel\u00f6scht"));
    }

    // --- Admin endpoints ---

    private void handleListUsers(HttpServletRequest req, HttpServletResponse resp) throws IOException, Authentication.AuthException {
        if (!authentication.handle(req, resp)) return;
        authentication.checkRole(req, "admin");

        CouchDBAuthConnection couchDB = getCouchDBConnection();
        if (couchDB == null) {
            writeResponse(req, resp, new JsonArray());
            return;
        }

        List<JsonObject> users = couchDB.listUsers();
        JsonArray array = new JsonArray();
        users.forEach(array::add);
        writeResponse(req, resp, array);
    }

    private void handleCreateUser(HttpServletRequest req, HttpServletResponse resp) throws IOException, Authentication.AuthException {
        if (!authentication.handle(req, resp)) return;
        authentication.checkRole(req, "admin");

        CouchDBAuthConnection couchDB = getCouchDBConnection();
        if (couchDB == null) {
            sendError(req, resp, HttpServletResponse.SC_BAD_REQUEST, "Benutzerverwaltung ist f\u00fcr diese Instanz nicht verf\u00fcgbar");
            return;
        }

        String json = IOUtils.toString(new InputStreamReader(req.getInputStream(), StandardCharsets.UTF_8));
        JsonObject object = new Gson().fromJson(json, JsonObject.class);
        String userid = JSON.string(object, "userid");
        String email = JSON.string(object, "email");
        String password = JSON.string(object, "password");
        String displayName = JSON.string(object, "displayName");

        if (userid == null || password == null) {
            sendError(req, resp, HttpServletResponse.SC_BAD_REQUEST, "userid und password sind erforderlich");
            return;
        }

        if (displayName == null) displayName = userid;
        if (email == null) email = "";

        JsonObject result = couchDB.register(userid, email, password, displayName);
        if (result != null) {
            writeResponse(req, resp, new JsonPrimitive(userid));
        } else {
            sendError(req, resp, HttpServletResponse.SC_CONFLICT, "Benutzer existiert bereits");
        }
    }

    private void handleEditUser(HttpServletRequest req, HttpServletResponse resp, String userid) throws IOException, Authentication.AuthException {
        if (!authentication.handle(req, resp)) return;
        authentication.checkRole(req, "admin");

        CouchDBAuthConnection couchDB = getCouchDBConnection();
        if (couchDB == null) {
            sendError(req, resp, HttpServletResponse.SC_BAD_REQUEST, "Benutzerverwaltung ist f\u00fcr diese Instanz nicht verf\u00fcgbar");
            return;
        }

        String json = IOUtils.toString(new InputStreamReader(req.getInputStream(), StandardCharsets.UTF_8));
        JsonObject object = new Gson().fromJson(json, JsonObject.class);
        String email = JSON.string(object, "email");
        String displayName = JSON.string(object, "displayName");
        JsonArray roles = object.has("roles") ? object.getAsJsonArray("roles") : null;

        couchDB.updateUser(userid, email, displayName, roles);
        writeResponse(req, resp, new JsonPrimitive(userid));
    }

    private void handleDeleteUser(HttpServletRequest req, HttpServletResponse resp, String userid) throws IOException, Authentication.AuthException {
        if (!authentication.handle(req, resp)) return;
        authentication.checkRole(req, "admin");

        CouchDBAuthConnection couchDB = getCouchDBConnection();
        if (couchDB == null) {
            sendError(req, resp, HttpServletResponse.SC_BAD_REQUEST, "Benutzerverwaltung ist f\u00fcr diese Instanz nicht verf\u00fcgbar");
            return;
        }

        couchDB.deleteUser(userid);
        writeResponse(req, resp, new JsonPrimitive(userid));
    }

    private void handleResetUserPassword(HttpServletRequest req, HttpServletResponse resp, String userid) throws IOException, Authentication.AuthException {
        if (!authentication.handle(req, resp)) return;
        authentication.checkRole(req, "admin");

        CouchDBAuthConnection couchDB = getCouchDBConnection();
        if (couchDB == null) {
            sendError(req, resp, HttpServletResponse.SC_BAD_REQUEST, "Benutzerverwaltung ist f\u00fcr diese Instanz nicht verf\u00fcgbar");
            return;
        }

        // Find user's email and create reset token
        List<JsonObject> users = couchDB.listUsers();
        String email = null;
        for (JsonObject user : users) {
            if (userid.equals(JSON.string(user, "userid"))) {
                email = JSON.string(user, "email");
                break;
            }
        }

        if (email != null && !email.isEmpty()) {
            String token = couchDB.createResetToken(email);
            if (token != null) {
                mailService.sendPasswordResetMail(email, token, Server.CLIENT.get());
            }
            writeResponse(req, resp, new JsonPrimitive("Reset-Mail gesendet"));
        } else {
            sendError(req, resp, HttpServletResponse.SC_BAD_REQUEST, "Keine E-Mail-Adresse hinterlegt");
        }
    }
}
