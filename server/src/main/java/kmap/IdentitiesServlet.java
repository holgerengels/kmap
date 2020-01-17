package kmap;


import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import org.apache.commons.io.IOUtils;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.List;
import java.util.Properties;

/**
 * Created by holger on 09.05.16.
 */

public class IdentitiesServlet
    extends JsonServlet
{
    private Students students;

    @Override
    public void init() throws ServletException {
        super.init();
        students = new Students(properties);
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
                    writeResponse(req, resp, array(this.students.readStudents()));
                }
                else if (classes != null) {
                    log("load classes = " + classes);
                    writeResponse(req, resp, array(this.students.readClasses()));
                }
                else if (match != null) {
                    log("match identities = " + match);
                    writeResponse(req, resp, array(this.students.filterIdentities(match)));
                }
                else if (expand != null) {
                    log("expand class = " + expand);
                    writeResponse(req, resp, array(this.students.expandClass(expand)));
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
