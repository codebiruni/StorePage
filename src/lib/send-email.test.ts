import { beforeEach, describe, expect, it, vi } from "vitest";

const { createTransport, verify, sendMail, compile, readFile } = vi.hoisted(
    () => ({
        createTransport: vi.fn(),
        verify: vi.fn(),
        sendMail: vi.fn(),
        compile: vi.fn(),
        readFile: vi.fn(),
    }),
);

vi.mock("nodemailer", () => ({ default: { createTransport } }));
vi.mock("handlebars", () => ({ default: { compile } }));
vi.mock("fs", () => ({ promises: { readFile } }));

const { envMock, publicEnvMock } = vi.hoisted(() => ({
    envMock: {
        APP_EMAIL: "shop@example.test",
        APP_PASS: "secret",
        EMAIL_HOST: "smtp.example.test",
        EMAIL_PORT: "2525",
        NODE_ENV: "test",
    } as Record<string, string | undefined>,
    publicEnvMock: { NEXT_PUBLIC_BRAND_NAME: "TestBrand" } as Record<
        string,
        string | undefined
    >,
}));

vi.mock("@/lib/env", () => ({ env: envMock, publicEnv: publicEnvMock }));

import { compileTemplate, sendEmail } from "@/lib/send-email";

beforeEach(() => {
    verify.mockReset().mockResolvedValue(true);
    sendMail.mockReset().mockResolvedValue({ messageId: "<msg-1>" });
    createTransport.mockReset().mockReturnValue({ verify, sendMail });
    compile.mockReset().mockReturnValue((data: unknown) => `compiled:${JSON.stringify(data)}`);
    readFile.mockReset().mockResolvedValue("<h1>{{title}}</h1>");

    envMock.APP_EMAIL = "shop@example.test";
    envMock.APP_PASS = "secret";
    envMock.EMAIL_HOST = "smtp.example.test";
    envMock.EMAIL_PORT = "2525";
    envMock.NODE_ENV = "test";
    publicEnvMock.NEXT_PUBLIC_BRAND_NAME = "TestBrand";

    vi.spyOn(console, "log").mockImplementation(() => { });
    vi.spyOn(console, "error").mockImplementation(() => { });
});

describe("lib/send-email › sendEmail", () => {
    it("creates a pooled SMTP transport from env", async () => {
        await sendEmail({ to: "a@b.c", subject: "Hi", text: "hello" });

        expect(createTransport).toHaveBeenCalledWith({
            host: "smtp.example.test",
            port: 2525,
            secure: false,
            auth: { user: "shop@example.test", pass: "secret" },
            pool: true,
            maxConnections: 5,
            maxMessages: 100,
        });
    });

    it("enables TLS in production", async () => {
        envMock.NODE_ENV = "production";
        await sendEmail({ to: "a@b.c", subject: "Hi", text: "hello" });

        expect(createTransport.mock.calls[0][0].secure).toBe(true);
    });

    it("defaults the host and port when env omits them", async () => {
        envMock.EMAIL_HOST = undefined;
        envMock.EMAIL_PORT = undefined;

        await sendEmail({ to: "a@b.c", subject: "Hi", text: "hello" });

        expect(createTransport.mock.calls[0][0].host).toBe("smtp.gmail.com");
        expect(createTransport.mock.calls[0][0].port).toBe(587);
    });

    it("verifies the transport before sending", async () => {
        await sendEmail({ to: "a@b.c", subject: "Hi", text: "hello" });
        expect(verify).toHaveBeenCalledTimes(1);
    });

    it("returns the nodemailer info object", async () => {
        await expect(
            sendEmail({ to: "a@b.c", subject: "Hi", text: "hello" }),
        ).resolves.toEqual({ messageId: "<msg-1>" });
    });

    it("builds the From header from the brand name", async () => {
        await sendEmail({
            to: "a@b.c",
            subject: "Hi",
            text: "x",
            brandName: "My Shop",
        });

        expect(sendMail.mock.calls[0][0].from).toBe(
            '"My Shop" <shop@example.test>',
        );
    });

    it("falls back to the public brand name", async () => {
        await sendEmail({ to: "a@b.c", subject: "Hi", text: "x" });
        expect(sendMail.mock.calls[0][0].from).toBe(
            '"TestBrand" <shop@example.test>',
        );
    });

    it("falls back to 'Store' when no brand is configured", async () => {
        publicEnvMock.NEXT_PUBLIC_BRAND_NAME = undefined;
        await sendEmail({ to: "a@b.c", subject: "Hi", text: "x" });

        expect(sendMail.mock.calls[0][0].from).toBe('"Store" <shop@example.test>');
    });

    it("joins multiple recipients with commas", async () => {
        await sendEmail({ to: ["a@b.c", "d@e.f"], subject: "Hi", text: "x" });

        expect(sendMail.mock.calls[0][0].to).toBe("a@b.c,d@e.f");
    });

    it("renders an hbs template when no html is given", async () => {
        const result = await sendEmail({
            to: "a@b.c",
            subject: "Hi",
            template: "welcome",
            templateData: { title: "Hello" },
        });

        expect(result).toEqual({ messageId: "<msg-1>" });
        const html = sendMail.mock.calls[0][0].html;
        expect(html).toContain("compiled:");
        expect(html).toContain("Hello");
    });

    it("prefers an explicit html body over a template", async () => {
        await sendEmail({
            to: "a@b.c",
            subject: "Hi",
            html: "<p>explicit</p>",
            template: "welcome",
        });

        expect(sendMail.mock.calls[0][0].html).toBe("<p>explicit</p>");
    });

    it("wraps plain text in a pre block when there is no html", async () => {
        await sendEmail({ to: "a@b.c", subject: "Hi", text: "plain body" });

        expect(sendMail.mock.calls[0][0].html).toContain("plain body");
    });

    it("derives the text part from html when text is omitted", async () => {
        await sendEmail({ to: "a@b.c", subject: "Hi", html: "<p>Hello</p>" });

        expect(sendMail.mock.calls[0][0].text).toContain("Hello");
    });

    it("omits attachments when none are provided", async () => {
        await sendEmail({ to: "a@b.c", subject: "Hi", text: "x" });
        expect(sendMail.mock.calls[0][0].attachments).toBeUndefined();
    });

    it("passes attachments through when provided", async () => {
        const attachments = [{ filename: "a.pdf", content: Buffer.from("x") }];
        await sendEmail({ to: "a@b.c", subject: "Hi", text: "x", attachments });

        expect(sendMail.mock.calls[0][0].attachments).toBe(attachments);
    });

    it("wraps a configuration failure in a descriptive error", async () => {
        envMock.APP_PASS = undefined;

        await expect(
            sendEmail({ to: "a@b.c", subject: "Hi", text: "x" }),
        ).rejects.toThrowError("Email sending failed: Email credentials are not configured");
    });

    it("wraps a transport failure in a descriptive error", async () => {
        sendMail.mockRejectedValue(new Error("SMTP timeout"));

        await expect(
            sendEmail({ to: "a@b.c", subject: "Hi", text: "x" }),
        ).rejects.toThrowError("Email sending failed: SMTP timeout");
    });

    it("reports an unknown error when a non-Error is thrown", async () => {
        sendMail.mockRejectedValue("boom");

        await expect(
            sendEmail({ to: "a@b.c", subject: "Hi", text: "x" }),
        ).rejects.toThrowError("Email sending failed: Unknown error");
    });
});

describe("lib/send-email › compileTemplate", () => {
    // The module caches compiled templates for the process lifetime, so every
    // test here must use a template name that is unique to it.
    let counter = 0;
    const unique = () => `tpl-${Date.now()}-${counter++}`;

    it("reads the template from the emails templates directory", async () => {
        const name = unique();
        await compileTemplate(name, {});

        const filePath = readFile.mock.calls[0][0] as string;
        expect(filePath).toContain("templates");
        expect(filePath).toContain("emails");
        expect(filePath.endsWith(`${name}.hbs`)).toBe(true);
    });

    it("reads the template with utf-8 encoding", async () => {
        await compileTemplate(unique(), {});
        expect(readFile.mock.calls[0][1]).toBe("utf-8");
    });

    it("compiles the template with the supplied data", async () => {
        const output = await compileTemplate(unique(), { title: "Hello" });
        expect(output).toContain("Hello");
    });

    it("caches a compiled template for repeat calls", async () => {
        compile.mockReset().mockReturnValue(() => "cached-output");
        const name = unique();

        await compileTemplate(name, {});
        await compileTemplate(name, {});

        expect(readFile).toHaveBeenCalledTimes(1);
    });
});
