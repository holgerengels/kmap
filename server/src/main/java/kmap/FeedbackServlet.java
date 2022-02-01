package kmap;


import com.google.gson.*;
import org.apache.commons.io.IOUtils;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

/**
 * Created by holger on 09.05.16.
 */

@MultipartConfig(
        fileSizeThreshold = 1024 * 1024,
        maxFileSize = 1024 * 1024 * 5,
        maxRequestSize = 1024 * 1024 * 5 * 5
)
public class FeedbackServlet
    extends JsonServlet
{
    private Feedback feedback;

    @Override
    public void init() throws ServletException {
        super.init();
        feedback = new Feedback(new Couch(properties));
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) {
        try {
            Server.CLIENT.set(extractClient(req));

            if (authentication.handle(req, resp)) {
                String userid = (String)req.getSession().getAttribute("user");
                String submit = req.getParameter("submit");
                String resolve = req.getParameter("resolve");
                String purge = req.getParameter("purge");

                if (submit != null) {
                    String json = IOUtils.toString(new InputStreamReader(req.getInputStream(), StandardCharsets.UTF_8));
                    feedback.submit(userid, json);
                    writeResponse(req, resp, new JsonPrimitive(submit));
                }
                else if (resolve != null) {
                    authentication.checkRole(req, "teacher");
                    if (authentication.handle(req, resp)) {
                        String json = IOUtils.toString(new InputStreamReader(req.getInputStream(), StandardCharsets.UTF_8));
                        feedback.resolve(json);
                        writeResponse(req, resp, new JsonPrimitive(resolve));
                    }
                }
                else if (purge != null) {
                    authentication.checkRole(req, "teacher");
                    if (authentication.handle(req, resp)) {
                        JsonObject request = new GsonBuilder().create().fromJson(new InputStreamReader(req.getInputStream(), StandardCharsets.UTF_8), JsonObject.class);
                        String until = request.getAsJsonPrimitive("until").getAsString();
                        Set<String> types = StreamSupport.stream(request.getAsJsonArray("types").spliterator(), false).map(JsonElement::getAsString).collect(Collectors.toSet());
                        List<JsonObject> objects = feedback.purge(until, types);
                        JsonArray array = new JsonArray();
                        objects.forEach(array::add);
                        writeResponse(req, resp, array);
                    }
                }
            }
            else {
                String error = req.getParameter("bug");
                if (error != null) {
                    String json = IOUtils.toString(new InputStreamReader(req.getInputStream(), StandardCharsets.UTF_8));
                    feedback.bug(json);
                    writeResponse(req, resp, new JsonPrimitive(error));
                }
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

    protected void doGet(HttpServletRequest req, HttpServletResponse resp) {
        try {
            Server.CLIENT.set(extractClient(req));

            req.setCharacterEncoding("UTF-8");
            String load = req.getParameter("load");
            if (load != null) {
                List<JsonObject> objects = feedback.load(load);
                JsonArray array = new JsonArray();
                objects.forEach(array::add);
                writeResponse(req, resp, array);
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
