package kmap;


import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonPrimitive;
import org.apache.commons.io.IOUtils;

import javax.servlet.ServletException;
import javax.servlet.annotation.MultipartConfig;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.Part;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.List;

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

            //if (authentication.handle(req, resp)) {
                String submit = req.getParameter("submit");
                String error = req.getParameter("error");
                String resolve = req.getParameter("resolve");

                if (submit != null) {
                    String json = IOUtils.toString(new InputStreamReader(req.getInputStream(), StandardCharsets.UTF_8));
                    feedback.submit(json);
                    writeResponse(req, resp, new JsonPrimitive(submit));
                }
                else if (error != null) {
                    String json = IOUtils.toString(new InputStreamReader(req.getInputStream(), StandardCharsets.UTF_8));
                    feedback.error(json);
                    writeResponse(req, resp, new JsonPrimitive(error));
                }
                else if (resolve != null) {
                    if (authentication.handle(req, resp)) {
                        String json = IOUtils.toString(new InputStreamReader(req.getInputStream(), StandardCharsets.UTF_8));
                        feedback.resolve(json);
                        writeResponse(req, resp, new JsonPrimitive(resolve));
                    }
                }
            //}
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
