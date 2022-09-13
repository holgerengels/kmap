package kmap;


import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.util.List;

/**
 * Created by holger on 09.05.16.
 */

public class IdentitiesServlet
    extends JsonServlet
{
    @Override
    public void init() throws ServletException {
        super.init();
    }

    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
        throws ServletException
    {
        try {
            if (authentication.handle(req, resp)) {
                String students = req.getParameter("students");
                String classes = req.getParameter("classes");
                String match = req.getParameter("match");
                String expand = req.getParameter("expand");
                if (students != null) {
                    log("load students = " + students);
                    writeResponse(req, resp, array(AuthConnection.get(properties).readStudents()));
                }
                else if (classes != null) {
                    log("load classes = " + classes);
                    writeResponse(req, resp, array(AuthConnection.get(properties).readClasses()));
                }
                else if (match != null) {
                    log("match identities = " + match);
                    writeResponse(req, resp, array(AuthConnection.get(properties).filterIdentities(match)));
                }
                else if (expand != null) {
                    log("expand class = " + expand);
                    writeResponse(req, resp, array(AuthConnection.get(properties).expandClass(expand)));
                }
                else
                    log("unknown request " + req.getParameterMap());
            }
        }
        catch (Exception e) {
            e.printStackTrace();
            sendError(req, resp, e);
        }
    }

    private JsonElement array(List<JsonObject> list) {
        JsonArray array = new JsonArray();
        list.forEach(array::add);
        return array;
    }
}
