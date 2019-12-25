package kmap;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonPrimitive;
import org.apache.commons.io.IOUtils;

/**
 * Created by holger on 09.05.16.
 */
public class StateServlet
    extends JsonServlet {
    private States states;

    @Override
    public void init() throws ServletException {
        super.init();
        states = new States(new Couch(properties));
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) {
        try {
            Server.CLIENT.set(extractClient(req));

            if (authentication.handle(req, resp)) {
                String userid = req.getParameter("userid");
                String save = req.getParameter("save");
                String subject = req.getParameter("subject");
                String storeCourses = req.getParameter("storeCourses");
                String storeCourse = req.getParameter("storeCourse");
                if (save != null) {
                    String json = IOUtils.toString(new InputStreamReader(req.getInputStream(), StandardCharsets.UTF_8));
                    JsonObject states = this.states.store(save, subject, json);
                    writeResponse(req, resp, states);
                }
                else if (storeCourses != null) {
                    log("store courses = " + storeCourses);
                    String json = IOUtils.toString(new InputStreamReader(req.getInputStream(), StandardCharsets.UTF_8));
                    states.storeCourses(userid, json);
                    writeResponse(req, resp, new JsonPrimitive(storeCourses));
                }
                else if (storeCourse != null) {
                    log("store course = " + storeCourse);
                    String json = IOUtils.toString(new InputStreamReader(req.getInputStream(), StandardCharsets.UTF_8));
                    states.storeCourse(userid, storeCourse, json);
                    writeResponse(req, resp, new JsonPrimitive(storeCourse));
                }
                else
                    log("unknown request " + req.getParameterMap());
            }
        }
        catch (Exception e) {
            e.printStackTrace();
            sendError(req, resp, e);
        }
        finally {
            Server.CLIENT.remove();
        }
    }

    protected void doGet(HttpServletRequest req, HttpServletResponse resp) {
        try {
            Server.CLIENT.set(extractClient(req));

            if (authentication.handle(req, resp)) {
                String userid = req.getParameter("userid");
                String load = req.getParameter("load");
                String subject = req.getParameter("subject");
                String courses = req.getParameter("courses");
                String course = req.getParameter("course");
                if (load != null) {
                    log("load state = " + load);
                    JsonObject state = course != null ? states.courseStates(load, course, subject) : states.statesAndProgress(load, subject);
                    if (state != null)
                        writeResponse(req, resp, state);
                }
                else if (courses != null) {
                    log("load courses = " + courses);
                    JsonArray array = states.courses(courses);
                    if (array != null)
                        writeResponse(req, resp, array);
                }
                else if (course != null) {
                    log("load course = " + course);
                    JsonArray object = states.course(userid, course);
                    if (object != null)
                        writeResponse(req, resp, object);
                }
                else
                    log("unknown request " + req.getParameterMap());
            }
        }
        catch (Exception e) {
            e.printStackTrace();
            sendError(req, resp, e);
        }
        finally {
            Server.CLIENT.remove();
        }
    }
}
