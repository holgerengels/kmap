package kmap;

import jakarta.mail.*;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import java.util.Properties;

public class MailService {
    private final Properties properties;
    private final String from;
    private final String baseUrl;

    public MailService(Properties properties) {
        this.properties = properties;
        this.from = properties.getProperty("mail.from", "noreply@kmap.eu");
        this.baseUrl = properties.getProperty("mail.base-url", "https://kmap.eu");
    }

    public void sendPasswordResetMail(String email, String token, String instance) {
        String resetLink = baseUrl + "/app/?reset-token=" + token;
        String subject = "KMap \u2013 Passwort zur\u00fccksetzen";
        String body = "Hallo,\n\n"
                + "du hast ein neues Passwort f\u00fcr KMap angefordert.\n\n"
                + "Klicke auf den folgenden Link, um dein Passwort zur\u00fcckzusetzen:\n"
                + resetLink + "\n\n"
                + "Der Link ist 1 Stunde g\u00fcltig.\n\n"
                + "Falls du kein neues Passwort angefordert hast, kannst du diese E-Mail ignorieren.\n\n"
                + "Viele Gr\u00fc\u00dfe,\nDein KMap-Team";

        sendMail(email, subject, body);
    }

    private void sendMail(String to, String subject, String body) {
        Properties mailProps = new Properties();
        mailProps.put("mail.smtp.host", properties.getProperty("mail.smtp.host", "localhost"));
        mailProps.put("mail.smtp.port", properties.getProperty("mail.smtp.port", "587"));
        mailProps.put("mail.smtp.auth", "true");

        if (Boolean.parseBoolean(properties.getProperty("mail.smtp.starttls", "true"))) {
            mailProps.put("mail.smtp.starttls.enable", "true");
        }

        String user = properties.getProperty("mail.smtp.user");
        String password = properties.getProperty("mail.smtp.password");

        Session session;
        if (user != null && password != null) {
            session = Session.getInstance(mailProps, new Authenticator() {
                @Override
                protected PasswordAuthentication getPasswordAuthentication() {
                    return new PasswordAuthentication(user, password);
                }
            });
        } else {
            session = Session.getInstance(mailProps);
        }

        try {
            Message message = new MimeMessage(session);
            message.setFrom(new InternetAddress(from));
            message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(to));
            message.setSubject(subject);
            message.setText(body);
            Transport.send(message);
            System.out.println("Mail sent to " + to);
        } catch (MessagingException e) {
            System.err.println("Failed to send mail to " + to + ": " + e.getMessage());
            e.printStackTrace();
        }
    }
}
