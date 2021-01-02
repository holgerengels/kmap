package kmap;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonPrimitive;
import org.apache.commons.io.IOUtils;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.Part;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;

/**
 * Created by holger on 09.05.16.
 */
@MultipartConfig(
        fileSizeThreshold = 1024 * 1024
)
public class ContentManagerServlet
    extends JsonServlet
{
    private ContentManager contentManager;
    private Instances instances;

    @Override
    public void init() throws ServletException {
        super.init();
        contentManager = new ContentManager(properties);
        instances = Instances.get(properties);
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) {
        try {
            Server.CLIENT.set(extractClient(req));

            if (authentication.handle(req, resp)) {
                String create = req.getParameter("create");
                String edit = req.getParameter("edit");
                String drop = req.getParameter("drop");
                String sync = req.getParameter("sync");
                String importModule = req.getParameter("import-module");
                String importSet = req.getParameter("import-set");
                String subject = req.getParameter("subject");
                String deleteModule = req.getParameter("delete-module");
                String deleteSet = req.getParameter("delete-set");

                if (importModule != null) {
                    authentication.checkRole(req, "teacher");
                    JsonArray modules = new JsonArray();
                    log("import module " + importModule);
                    for (Part part : req.getParts()) {
                        String name = getFileName(part);
                        String[] strings;
                        strings = contentManager.importModule(part.getInputStream());
                        System.out.println("imported " + String.join(" - ", strings));
                        modules.add(String.join(" - ", strings));
                    }
                    writeResponse(req, resp, modules);
                }
                else if (importSet != null) {
                    authentication.checkRole(req, "teacher");
                    JsonArray sets = new JsonArray();
                    log("import set " + importSet);
                    for (Part part : req.getParts()) {
                        String name = getFileName(part);
                        String[] strings;
                        strings = contentManager.importSet(part.getInputStream());
                        System.out.println("imported " + String.join(" - ", strings));
                        sets.add(String.join(" - ", strings));
                    }
                    writeResponse(req, resp, sets);
                }
                else if (deleteModule != null) {
                    authentication.checkRole(req, "teacher");
                    JsonArray sets = new JsonArray();
                    log("delete module " + deleteModule);
                    JsonObject object = contentManager.deleteModule(subject, deleteModule);
                    writeResponse(req, resp, object);
                }
                else if (create != null) {
                    authentication.checkRole(req, "admin");
                    String json = IOUtils.toString(new InputStreamReader(req.getInputStream(), StandardCharsets.UTF_8));
                    instances.createInstance(json);
                    writeResponse(req, resp, new JsonPrimitive(create));
                }
                else if (edit != null) {
                    authentication.checkRole(req, "admin");
                    String json = IOUtils.toString(new InputStreamReader(req.getInputStream(), StandardCharsets.UTF_8));
                    instances.editInstance(edit, json);
                    writeResponse(req, resp, new JsonPrimitive(edit));
                }
                else if (drop != null) {
                    authentication.checkRole(req, "admin");
                    instances.dropInstance(drop);
                    writeResponse(req, resp, new JsonPrimitive(drop));
                }
                else if (sync != null) {
                    authentication.checkRole(req, "admin");
                    String json = IOUtils.toString(new InputStreamReader(req.getInputStream(), StandardCharsets.UTF_8));
                    contentManager.syncInstance(json);
                    writeResponse(req, resp, new JsonPrimitive(sync));
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

    private String getFileName(Part part) {
        for (String content : part.getHeader("content-disposition").split(";")) {
            if (content.trim().startsWith("filename"))
                return content.substring(content.indexOf("=") + 2, content.length() - 1);
        }
        return "noname";
    }

    protected void doGet(HttpServletRequest req, HttpServletResponse resp) {
        try {
            Server.CLIENT.set(extractClient(req));

            req.setCharacterEncoding("UTF-8");
            String instances = req.getParameter("instances");
            String subject = req.getParameter("subject");
            String exportModule = req.getParameter("export-module");
            String exportSet = req.getParameter("export-set");
            if (instances != null) {
                JsonArray result = this.instances.instances();
                if (result != null)
                    writeResponse(req, resp, result);
            }
            else if (exportModule != null) {
                log("export module " + subject + " - " + exportModule);
                newSessionHeader(req, resp);
                corsHeaders(req, resp);
                resp.setContentType("application/zip");
                contentManager.exportModule(subject, exportModule, resp.getOutputStream());
            }
            else if (exportSet != null) {
                log("export set " + subject + " - " + exportSet);
                newSessionHeader(req, resp);
                corsHeaders(req, resp);
                resp.setContentType("application/zip");
                contentManager.exportSet(subject, exportSet, resp.getOutputStream());
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
