package kmap;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonPrimitive;
import org.apache.commons.io.IOUtils;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.List;

/**
 * Created by holger on 09.05.16.
 */

public class EditServlet
    extends JsonServlet
{
    private Couch couch;
    private Cloud cloud;

    @Override
    public void init() throws ServletException {
        super.init();
        couch = new Couch(properties);
        cloud = new Cloud(properties);
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) {
        try {
            Server.CLIENT.set(extractClient(req));

            if (authentication.handle(req, resp)) {
                String subject = req.getParameter("subject");
                String save = req.getParameter("save");
                String imp = req.getParameter("import");
                String delete = req.getParameter("delete");
                if (save != null) {
                    authentication.checkRole(req, "teacher");
                    log("save topic = " + save);
                    String json = IOUtils.toString(new InputStreamReader(req.getInputStream(), "UTF-8"));
                    String command = couch.storeTopic(subject, save, json);
                    if (command.startsWith("error:"))
                        writeResponse(req, resp, "error", command.substring("error:".length()));
                    else
                        writeResponse(req, resp, "success", new JsonPrimitive(command));
                }
                /*
                else if (imp != null) {
                    log("import module = " + imp);
                    String json = IOUtils.toString(new InputStreamReader(req.getInputStream(), "UTF-8"));
                    JsonObject module = couch.importModule(subject, imp, json);
                    writeResponse(req, resp, "success", module);
                }
                else if (delete != null) {
                    log("delete module = " + delete);
                    JsonObject module = couch.deleteModule(subject, delete);
                    writeResponse(req, resp, "success", module);
                }
                 */
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
            String modules = req.getParameter("modules");
            String subject = req.getParameter("subject");
            String load = req.getParameter("load");
            String directory = req.getParameter("directory");
            String attachments = req.getParameter("attachments");
            if (modules != null) {
                log("modules = " + modules);
                JsonArray array = couch.loadModules();
                if (array != null)
                    writeObject(req, resp, array.toString());
            }
            else if (load != null) {
                log("load chapter = " + load);
                JsonArray array = couch.loadModule(subject, load);
                if (array != null)
                    writeResponse(req, resp, "data", array);
            }
            else if (directory != null) { // TODO: move to POST
                log("directory for = " + directory);
                String[] split = directory.split("/");
                String link = cloud.createDirectory(split[0], split[1], split[2]);
                writeResponse(req, resp, "success", new JsonPrimitive(link));
            }
            else if (attachments != null) {
                log("attachments for = " + attachments);
                String[] split = attachments.split("/");
                List<Cloud.Attachment> list = cloud.findAttachments(split[0], split[1], split[2], false);
                if (list != null) {
                    JsonArray array = new JsonArray();
                    for (Cloud.Attachment attachment : list) {
                        JsonObject object = new JsonObject();
                        object.addProperty("name", attachment.name);
                        object.addProperty("tag", attachment.tag);
                        object.addProperty("type", attachment.type);
                        array.add(object);
                    }
                    writeResponse(req, resp, "data", array);
                }
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

    @Deprecated
    protected void writeObject(HttpServletRequest request, HttpServletResponse resp, String node) throws IOException {
        resp.setContentType("application/json");
        resp.setCharacterEncoding("utf-8");
        corsHeaders(request, resp);
        resp.getWriter().print(node);
    }
}
