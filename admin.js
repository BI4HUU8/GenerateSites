
        const DEFAULT_SETTINGS = {
            header: {
                logoType: "image",
                logo: "/logo.png",
                logoText: "",
                background: "#ffffff",
                backgroundOpacity: 100,
                backgroundBlur: 0,
                textColor: "#222222",
                air: false,
                fixed: false,
                blackTheme: false,
                telephoneEnabled: false,
                telephone: "",
                telephonePosition: "before",
                links: [
                    { label: "About", url: "#about" },
                    { label: "Contact", url: "#contact" }
                ]
            },
            body: {
                template1: {
                    enabled: true,
                    background: "#edf5f9",
                    blockBackground: "#ffffff",
                    blockOpacity: 100,
                    blockBlur: 0,
                    textColor: "#141228",
                    textGray: "#657087",
                    pages: [
                        {
                            name: "Главная",
                            slug: "home",
                            sections: [
                                {
                                    type: "hero",
                                    enabled: true,
                                    eyebrow: "",
                                    title: "Заголовок",
                                    subtitle: "Текст підзаголовка.",
                                    backgroundImage: "",
                                    buttonLabel: "",
                                    buttonUrl: ""
                                },
                                {
                                    type: "about",
                                    enabled: true,
                                    eyebrow: "Над заголовок",
                                    title: "Заголовок",
                                    text: "Текст підзаголовка.",
                                    images: ["/images/1.jpg", "/images/2.jpg", "/images/3.jpg"],
                                    items: ["Текст.", "Текст.", "Текст.", "Текст."],
                                    buttonLabel: "Познакомьтесь с командой",
                                    buttonUrl: "/team"
                                },
                                {
                                    type: "contact",
                                    enabled: true,
                                    title: "Contact",
                                    intro: "Напишіть або зателефонуйте нам.",
                                    phone: "",
                                    email: "",
                                    address: "",
                                    hours: ""
                                },
                                {
                                    type: "faq",
                                    enabled: true,
                                    title: "Common Questions",
                                    items: [
                                        { question: "Do you offer 24/7 emergency service?", answer: "" },
                                        { question: "How often should I service my HVAC system?", answer: "" },
                                        { question: "Are your technicians licensed and insured?", answer: "" },
                                        { question: "Do you offer financing for new installations?", answer: "" }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            },
            seo: {
                title: "",
                description: "",
                keywords: "",
                canonical: "",
                robots: "index, follow",
                ogTitle: "",
                ogDescription: "",
                ogImage: "",
                generative: {
                    name: "",
                    summary: "",
                    audience: "",
                    services: [],
                    expertise: [],
                    profiles: [],
                    language: "uk"
                }
            }
        };
        const COOKIE_NAME = "setting";
        const COOKIE_MAX_BYTES = 3800;
        const AUTOSAVE_KEY = "site_builder_settings_autosave";
        const form = document.getElementById("settingsForm");
        const linksList = document.getElementById("linksList");
        const preview = document.getElementById("preview");
        const bodySections = document.getElementById("bodySections");
        const bodyPreview = document.getElementById("bodyPreview");
        const previewMode = document.getElementById("previewMode");
        const status = document.getElementById("status");
        let bodyPages = [];
        let activeBodyPageIndex = 0;
        let autosaveTimer = null;

        function escapeHtml(value) {
            return String(value).replace(/[&<>"']/g, (character) => ({
                "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
            })[character]);
        }

        function hexToRgba(hex, opacity) {
            const normalized = /^#[0-9a-f]{6}$/i.test(hex) ? hex : "#ffffff";
            const red = parseInt(normalized.slice(1, 3), 16);
            const green = parseInt(normalized.slice(3, 5), 16);
            const blue = parseInt(normalized.slice(5, 7), 16);
            return `rgba(${red}, ${green}, ${blue}, ${Math.max(0, Math.min(100, Number(opacity) || 0)) / 100})`;
        }

        function clampNumber(value, min, max, fallback) {
            const number = Number(value);
            return Number.isFinite(number) ? Math.max(min, Math.min(max, number)) : fallback;
        }

        function textList(value) {
            const values = Array.isArray(value) ? value : typeof value === "string" ? value.split("\n") : [];
            return values.map((item) => String(item).trim()).filter(Boolean);
        }

        function safeUrl(value, fieldName) {
            const url = value.trim();
            if (!url) return "";
            if (/^(https?:|mailto:|tel:)/i.test(url) || /^(\/|\.\/|\.\.\/|#|\?)/.test(url)) {
                return url;
            }
            throw new Error(`${fieldName}: використовуйте http(s), mailto, tel або відносний URL.`);
        }

        function readSettings(value) {
            if (!value || typeof value !== "object" || !value.header || typeof value.header !== "object") {
                throw new Error("Неправильний формат налаштувань у setting.json.");
            }
            const header = value.header;
            if (!Array.isArray(header.links)) throw new Error("Список посилань має бути масивом.");
            if (!/^#[0-9a-f]{6}$/i.test(header.background) || !/^#[0-9a-f]{6}$/i.test(header.textColor)) {
                throw new Error("Кольори мають бути в HEX-форматі #RRGGBB.");
            }
            const logoType = header.logoType === "text" ? "text" : "image";
            const logo = logoType === "image"
                ? safeUrl(String(header.logo || ""), "URL логотипа")
                : "";
            const logoText = String(header.logoText || "").trim();
            const backgroundOpacity = clampNumber(header.backgroundOpacity, 0, 100, 100);
            const backgroundBlur = clampNumber(header.backgroundBlur, 0, 30, 0);
            const headerBackground = /^#[0-9a-f]{6}$/i.test(header.backgroundColor || "")
                ? header.backgroundColor
                : header.background;
            const telephoneEnabled = header.telephoneEnabled === true;
            const telephone = String(header.telephone || "").trim();
            const telephonePosition = header.telephonePosition === "after" ? "after" : "before";
            const normalizedTelephone = telephone.replace(/[^\d+]/g, "");
            if (telephoneEnabled && !/^\+?\d{5,15}$/.test(normalizedTelephone)) {
                throw new Error("Вкажіть номер телефону з 5–15 цифр, можна з + на початку.");
            }
            const links = header.links.map((link, index) => {
                if (!link || typeof link.label !== "string" || typeof link.url !== "string") {
                    throw new Error(`Посилання ${index + 1} має містити label і url.`);
                }
                return { label: link.label.trim(), url: safeUrl(link.url, `Посилання ${index + 1}`) };
            }).filter((link) => link.label && link.url);
            const seoInput = value.seo && typeof value.seo === "object" ? value.seo : {};
            const generativeInput = seoInput.generative && typeof seoInput.generative === "object"
                ? seoInput.generative
                : {};
            const legacyGeoInput = seoInput.geo && typeof seoInput.geo === "object" ? seoInput.geo : {};
            const seoText = (field, fallback = "") => {
                const text = seoInput[field];
                return String(text === undefined ? fallback : text).trim();
            };
            const profileLinks = textList(generativeInput.profiles).map((profile, index) => {
                let url;
                try {
                    url = new URL(profile);
                } catch {
                    throw new Error(`GEO-профіль ${index + 1} має бути повним URL з http:// або https://.`);
                }
                if (!["http:", "https:"].includes(url.protocol)) {
                    throw new Error(`GEO-профіль ${index + 1} має бути URL з http:// або https://.`);
                }
                return url.href;
            });
            const seo = {
                title: seoText("title"),
                description: seoText("description"),
                keywords: seoText("keywords"),
                canonical: safeUrl(seoText("canonical"), "Canonical URL"),
                robots: seoText("robots", "index, follow"),
                ogTitle: seoText("ogTitle"),
                ogDescription: seoText("ogDescription"),
                ogImage: safeUrl(seoText("ogImage"), "Open Graph зображення"),
                generative: {
                    name: String(generativeInput.name || "").trim(),
                    summary: String(generativeInput.summary || "").trim(),
                    audience: String(generativeInput.audience || "").trim(),
                    services: textList(generativeInput.services),
                    expertise: textList(generativeInput.expertise),
                    profiles: profileLinks,
                    language: seoText("language", String(legacyGeoInput.language || "uk"))
                }
            };
            const bodyConfig = value.body?.template1 || DEFAULT_SETTINGS.body.template1;
            if (!/^#[0-9a-f]{6}$/i.test(bodyConfig.background || "") ||
                !/^#[0-9a-f]{6}$/i.test(bodyConfig.textColor || "")) {
                throw new Error("Кольори body мають бути в HEX-форматі #RRGGBB.");
            }
            if (!/^#[0-9a-f]{6}$/i.test(bodyConfig.blockBackground || "#ffffff") ||
                !/^#[0-9a-f]{6}$/i.test(bodyConfig.textGray || "#657087")) {
                throw new Error("Кольори блоків і сірого тексту мають бути в HEX-форматі #RRGGBB.");
            }
            const blockBackground = bodyConfig.blockBackground || "#ffffff";
            const blockOpacity = clampNumber(bodyConfig.blockOpacity, 0, 100, 100);
            const blockBlur = clampNumber(bodyConfig.blockBlur, 0, 30, 0);
            const textGray = bodyConfig.textGray || "#657087";
            const pageInputs = Array.isArray(bodyConfig.pages)
                ? bodyConfig.pages
                : Array.isArray(bodyConfig.sections)
                    ? [{ name: "Головна", slug: "home", sections: bodyConfig.sections }]
                    : null;
            if (!pageInputs || !pageInputs.length) throw new Error("Додайте щонайменше одну сторінку body.");
            const usedSlugs = new Set();
            const pages = pageInputs.map((page, pageIndex) => {
                if (!page || typeof page.name !== "string" || typeof page.slug !== "string" ||
                    !Array.isArray(page.sections)) {
                    throw new Error(`Сторінка ${pageIndex + 1} має містити name, slug і масив sections.`);
                }
                const name = page.name.trim();
                const slug = page.slug.trim().toLowerCase();
                if (!name) throw new Error(`Вкажіть назву сторінки ${pageIndex + 1}.`);
                if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
                    throw new Error(`Slug сторінки «${name}» має містити лише латинські літери, цифри та дефіси.`);
                }
                if (pageIndex > 0 && slug === "index") {
                    throw new Error("Slug «index» зарезервований для головної сторінки.");
                }
                if (usedSlugs.has(slug)) throw new Error(`Slug «${slug}» використовується кілька разів.`);
                usedSlugs.add(slug);
                const sections = page.sections.map((section, index) => {
                    const blockLabel = `Блок ${index + 1} сторінки «${name}»`;
                    if (!section || !["hero", "about", "contact", "faq", "features"].includes(section.type)) {
                        throw new Error(`${blockLabel}: підтримуються типи hero, about, contact, faq і features.`);
                    }
                    const text = (value, label) => {
                        if (value !== undefined && typeof value !== "string") {
                            throw new Error(`${blockLabel}: поле «${label}» має бути текстом.`);
                        }
                        return String(value || "").trim();
                    };
                    const sectionBase = { type: section.type, enabled: section.enabled !== false };
                    if (section.type === "hero") {
                        const image = safeUrl(String(section.backgroundImage || section.image || ""), `Фонове зображення (${blockLabel})`);
                        const buttonUrl = safeUrl(text(section.buttonUrl, "URL кнопки"), `URL кнопки (${blockLabel})`);
                        return {
                            ...sectionBase,
                            eyebrow: text(section.eyebrow, "надзаголовок"),
                            title: text(section.title, "заголовок"),
                            subtitle: text(section.subtitle, "опис"),
                            backgroundImage: image,
                            buttonLabel: text(section.buttonLabel, "текст кнопки"),
                            buttonUrl
                        };
                    }
                    if (section.type === "about") {
                        if (!Array.isArray(section.images) || !Array.isArray(section.items)) {
                            throw new Error(`${blockLabel}: images та items мають бути масивами.`);
                        }
                        return {
                            ...sectionBase,
                            eyebrow: text(section.eyebrow, "надзаголовок"),
                            title: text(section.title, "заголовок"),
                            text: text(section.text ?? section.description, "опис"),
                            images: section.images.map((image, imageIndex) =>
                                safeUrl(String(image || ""), `Зображення ${imageIndex + 1} (${blockLabel})`)
                            ).filter(Boolean),
                            items: section.items.map((item) => text(item, "пункт списку")).filter(Boolean),
                            buttonLabel: text(section.buttonLabel, "текст кнопки"),
                            buttonUrl: safeUrl(text(section.buttonUrl, "URL кнопки"), `URL кнопки (${blockLabel})`)
                        };
                    }
                    if (section.type === "contact") {
                        const phone = text(section.phone, "телефон");
                        const normalizedPhone = phone.replace(/[^\d+]/g, "");
                        if (phone && !/^\+?\d{5,15}$/.test(normalizedPhone)) {
                            throw new Error(`${blockLabel}: телефон має містити 5–15 цифр, можна з + на початку.`);
                        }
                        const email = text(section.email, "email");
                        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                            throw new Error(`${blockLabel}: вкажіть коректну email-адресу.`);
                        }
                        return {
                            ...sectionBase,
                            title: text(section.title, "заголовок"),
                            intro: text(section.intro, "опис"),
                            phone,
                            email,
                            address: text(section.address, "адреса"),
                            hours: text(section.hours, "графік роботи")
                        };
                    }
                    if (section.type === "faq") {
                        if (!Array.isArray(section.items)) throw new Error(`${blockLabel}: items має бути масивом.`);
                        return {
                            ...sectionBase,
                            title: text(section.title, "заголовок"),
                            items: section.items.map((item, itemIndex) => {
                                if (!item || typeof item !== "object") {
                                    throw new Error(`Питання ${itemIndex + 1} (${blockLabel}) має бути об’єктом.`);
                                }
                                return {
                                    question: text(item.question, "запитання"),
                                    answer: text(item.answer, "відповідь")
                                };
                            }).filter((item) => item.question || item.answer)
                        };
                    }
                    if (!Array.isArray(section.items)) throw new Error(`${blockLabel}: items має бути масивом.`);
                    return {
                        ...sectionBase,
                        title: text(section.title, "заголовок"),
                        items: section.items.map((item, itemIndex) => {
                            if (!item || typeof item !== "object") {
                                throw new Error(`Перевага ${itemIndex + 1} (${blockLabel}) має бути об’єктом.`);
                            }
                            return {
                                icon: safeUrl(String(item.icon || ""), `Іконка переваги ${itemIndex + 1} (${blockLabel})`),
                                title: text(item.title, "назва переваги"),
                                description: text(item.description, "опис переваги")
                            };
                        })
                    };
                });
                return { name, slug, sections };
            });
            return {
                header: {
                    logoType,
                    logo,
                    logoText,
                    background: headerBackground,
                    backgroundOpacity,
                    backgroundBlur,
                    textColor: header.textColor,
                    air: header.air === true,
                    fixed: header.fixed === true,
                    blackTheme: header.blackTheme === true,
                    telephoneEnabled,
                    telephone,
                    telephonePosition,
                    links
                },
                body: {
                    template1: {
                        enabled: true,
                        background: bodyConfig.background,
                        blockBackground,
                        blockOpacity,
                        blockBlur,
                        textColor: bodyConfig.textColor,
                        textGray,
                        pages
                    }
                },
                seo
            };
        }

        function pageSlugFromUrl(url) {
            if (url.startsWith("#")) return url.slice(1).toLowerCase();
            if (!url.startsWith("/") || url.startsWith("//")) return "";
            return url.split(/[?#]/)[0].split("/").filter(Boolean).pop()?.toLowerCase().replace(/\.html$/, "") || "";
        }

        function generatedPageFileName(body, pageIndex) {
            return pageIndex === 0 ? "index.html" : `${body.pages[pageIndex].slug}.html`;
        }

        function pageForLink(link) {
            const slug = pageSlugFromUrl(link.url);
            return bodyPages.find((page) => page.slug === slug);
        }

        function addLinkRow(link = { label: "", url: "" }, pageSlug = "") {
            const row = document.createElement("div");
            row.className = "link-row";
            row.dataset.pageSlug = pageSlug || pageForLink(link)?.slug || "";
            const labelInput = document.createElement("input");
            labelInput.className = "link-label";
            labelInput.type = "text";
            labelInput.placeholder = "Назва";
            labelInput.value = link.label || "";
            labelInput.setAttribute("aria-label", "Назва посилання");
            const urlInput = document.createElement("input");
            urlInput.className = "link-url";
            urlInput.type = "text";
            urlInput.placeholder = "/page або https://example.com";
            urlInput.value = link.url || "";
            urlInput.setAttribute("aria-label", "URL посилання");
            urlInput.addEventListener("input", () => {
                row.dataset.pageSlug = pageForLink({ url: urlInput.value })?.slug || "";
                editButton.setAttribute("aria-label", row.dataset.pageSlug ? "Редагувати сторінку" : "Редагувати посилання");
            });
            const editButton = document.createElement("button");
            editButton.className = "secondary edit-link";
            editButton.type = "button";
            editButton.textContent = "Редагувати";
            editButton.setAttribute("aria-label", row.dataset.pageSlug ? "Редагувати сторінку" : "Редагувати посилання");
            editButton.addEventListener("click", () => {
                saveActiveBodyPage();
                const pageIndex = bodyPages.findIndex((page) => page.slug === row.dataset.pageSlug);
                if (pageIndex >= 0) {
                    renderBodyPageEditor(pageIndex);
                    refreshBodyPreview();
                    document.getElementById("body-settings-title").scrollIntoView({ behavior: "smooth" });
                    document.getElementById("bodyPageName").focus();
                } else {
                    labelInput.focus();
                }
            });
            const removeButton = document.createElement("button");
            removeButton.className = "remove-link";
            removeButton.type = "button";
            removeButton.textContent = "-";
            removeButton.addEventListener("click", () => {
                const linkName = labelInput.value.trim() || urlInput.value.trim() || "це посилання";
                if (window.confirm(`Видалити посилання «${linkName}»?`)) {
                    row.remove();
                    scheduleAutosave();
                }
            });
            row.append(labelInput, urlInput, editButton, removeButton);
            linksList.appendChild(row);
        }

        function addMissingPageLinks(pages) {
            const linkedSlugs = new Set(
                [...linksList.querySelectorAll(".link-row")]
                    .map((row) => row.dataset.pageSlug)
                    .filter(Boolean)
            );
            pages.slice(1).forEach((page) => {
                if (linkedSlugs.has(page.slug)) return;
                addLinkRow({ label: page.name, url: `#${page.slug}` }, page.slug);
                linkedSlugs.add(page.slug);
            });
        }

        function addBodyField(section, key, label, value, multiline = false, hint = "") {
            const field = document.createElement("label");
            field.className = "field";
            field.textContent = label;
            const input = document.createElement(multiline ? "textarea" : "input");
            if (!multiline) input.type = "text";
            input.dataset.key = key;
            input.value = value || "";
            if (hint) input.placeholder = hint;
            field.appendChild(input);
            section.appendChild(field);
        }

        function addFaqItemEditor(container, item = { question: "", answer: "" }) {
            const row = document.createElement("div");
            row.className = "faq-item-editor";
            const questionField = document.createElement("label");
            questionField.className = "field";
            questionField.textContent = "Запитання";
            const questionInput = document.createElement("input");
            questionInput.type = "text";
            questionInput.dataset.faqQuestion = "true";
            questionInput.value = item.question || "";
            questionInput.placeholder = "Наприклад, чи є термінове обслуговування?";
            questionField.appendChild(questionInput);

            const answerField = document.createElement("label");
            answerField.className = "field";
            answerField.textContent = "Відповідь";
            const answerInput = document.createElement("textarea");
            answerInput.dataset.faqAnswer = "true";
            answerInput.value = item.answer || "";
            answerInput.placeholder = "Введіть відповідь";
            answerField.appendChild(answerInput);

            const removeButton = document.createElement("button");
            removeButton.className = "remove-link";
            removeButton.type = "button";
            removeButton.textContent = "Видалити питання";
            removeButton.addEventListener("click", () => {
                if (window.confirm("Видалити це запитання?")) {
                    row.remove();
                    refreshBodyPreview();
                    scheduleAutosave();
                }
            });
            row.append(questionField, answerField, removeButton);
            container.appendChild(row);
        }

        function addBodySection(sectionData = { type: "hero" }) {
            const card = document.createElement("article");
            card.className = "body-section is-collapsed";
            card.dataset.type = sectionData.type;
            const actions = document.createElement("div");
            actions.className = "section-actions";
            const heading = document.createElement("h3");
            const headingText = {
                hero: "Hero — обкладинка",
                about: "About — про практику",
                contact: "Contact — контакти",
                faq: "FAQ — поширені питання",
                features: "Features — переваги"
            }[sectionData.type];
            const collapseButton = document.createElement("button");
            collapseButton.className = "section-collapse";
            collapseButton.type = "button";
            collapseButton.textContent = headingText;
            collapseButton.setAttribute("aria-expanded", "false");
            collapseButton.setAttribute("aria-label", `Розгорнути налаштування блока ${headingText}`);
            collapseButton.addEventListener("click", () => {
                const expanded = collapseButton.getAttribute("aria-expanded") === "true";
                collapseButton.setAttribute("aria-expanded", String(!expanded));
                collapseButton.setAttribute(
                    "aria-label",
                    `${expanded ? "Розгорнути" : "Згорнути"} налаштування блока ${headingText}`
                );
                card.classList.toggle("is-collapsed", expanded);
                settings.hidden = expanded;
            });
            heading.appendChild(collapseButton);
            const enabledLabel = document.createElement("label");
            enabledLabel.className = "section-enabled";
            const enabledInput = document.createElement("input");
            enabledInput.type = "checkbox";
            enabledInput.dataset.enabled = "true";
            enabledInput.checked = sectionData.enabled !== false;
            enabledLabel.append(enabledInput, document.createTextNode(""));
            const orderButtons = document.createElement("div");
            orderButtons.className = "section-order";
            const moveUpButton = document.createElement("button");
            moveUpButton.type = "button";
            moveUpButton.textContent = "↑";
            moveUpButton.setAttribute("aria-label", `Перемістити блок «${headingText}» вгору`);
            moveUpButton.addEventListener("click", () => moveBodySection(card, -1));
            const moveDownButton = document.createElement("button");
            moveDownButton.type = "button";
            moveDownButton.textContent = "↓";
            moveDownButton.setAttribute("aria-label", `Перемістити блок «${headingText}» вниз`);
            moveDownButton.addEventListener("click", () => moveBodySection(card, 1));
            orderButtons.append(moveUpButton, moveDownButton);
            const removeButton = document.createElement("button");
            removeButton.className = "remove-link";
            removeButton.type = "button";
            removeButton.textContent = "-";
            removeButton.addEventListener("click", () => {
                if (window.confirm(`Видалити блок «${headingText}»?`)) {
                    card.remove();
                    updateBodySectionMoveButtons();
                    refreshBodyPreview();
                    scheduleAutosave();
                }
            });
            actions.append(heading, enabledLabel, orderButtons, removeButton);
            card.appendChild(actions);
            const settings = document.createElement("div");
            settings.className = "section-settings";
            settings.hidden = true;
            card.appendChild(settings);

            if (sectionData.type === "hero") {
                addBodyField(settings, "eyebrow", "Надзаголовок", sectionData.eyebrow);
                addBodyField(settings, "title", "Заголовок", sectionData.title);
                addBodyField(settings, "subtitle", "Опис", sectionData.subtitle, true);
                addBodyField(settings, "backgroundImage", "URL фонового зображення", sectionData.backgroundImage || sectionData.image, false, "/images/hero.jpg");
                addBodyField(settings, "buttonLabel", "Текст кнопки", sectionData.buttonLabel);
                addBodyField(settings, "buttonUrl", "URL кнопки", sectionData.buttonUrl, false, "#contact");
            } else if (sectionData.type === "about") {
                addBodyField(settings, "eyebrow", "Надзаголовок", sectionData.eyebrow);
                addBodyField(settings, "title", "Заголовок", sectionData.title);
                addBodyField(settings, "text", "Опис", sectionData.text || sectionData.description, true);
                addBodyField(settings, "images", "URL зображень (кожне з нового рядка)", (sectionData.images || []).join("\n"), true);
                addBodyField(settings, "items", "Пункти списку (кожен з нового рядка)", (sectionData.items || []).join("\n"), true);
                addBodyField(settings, "buttonLabel", "Текст кнопки", sectionData.buttonLabel);
                addBodyField(settings, "buttonUrl", "URL кнопки", sectionData.buttonUrl, false, "#contact");
            } else if (sectionData.type === "contact") {
                addBodyField(settings, "title", "Заголовок", sectionData.title || "Contact");
                addBodyField(settings, "intro", "Опис", sectionData.intro, true);
                addBodyField(settings, "phone", "Телефон", sectionData.phone);
                addBodyField(settings, "email", "Email", sectionData.email);
                addBodyField(settings, "address", "Адреса", sectionData.address);
                addBodyField(settings, "hours", "Графік роботи", sectionData.hours);
            } else if (sectionData.type === "faq") {
                addBodyField(settings, "title", "Заголовок", sectionData.title || "Common Questions");
                const faqEditor = document.createElement("div");
                faqEditor.className = "faq-editor";
                const faqItems = document.createElement("div");
                faqItems.className = "faq-items";
                (sectionData.items || []).forEach((item) => addFaqItemEditor(faqItems, item));
                const addButton = document.createElement("button");
                addButton.className = "secondary";
                addButton.type = "button";
                addButton.textContent = "Додати питання";
                addButton.addEventListener("click", () => {
                    addFaqItemEditor(faqItems);
                    refreshBodyPreview();
                    scheduleAutosave();
                });
                faqEditor.append(faqItems, addButton);
                settings.appendChild(faqEditor);
            } else {
                addBodyField(settings, "title", "Заголовок", sectionData.title);
                addBodyField(settings, "items", "Переваги: назва | опис | URL іконки (кожна з нового рядка)",
                    (sectionData.items || []).map((item) => [item.title, item.description, item.icon].join(" | ")).join("\n"), true);
            }
            settings.addEventListener("input", () => refreshBodyPreview());
            bodySections.appendChild(card);
        }

        function sectionsFromForm(container = bodySections) {
            const sections = [...container.querySelectorAll(".body-section")].map((card) => {
                const section = {
                    type: card.dataset.type,
                    enabled: card.querySelector("[data-enabled]").checked
                };
                card.querySelectorAll("[data-key]").forEach((input) => {
                    const key = input.dataset.key;
                    const value = input.value.trim();
                    if (key === "images" || key === "items") {
                        section[key] = value.split("\n").map((line) => line.trim()).filter(Boolean);
                    } else {
                        section[key] = value;
                    }
                });
                if (section.type === "features") {
                    section.items = section.items.map((line) => {
                        const [title = "", description = "", icon = ""] = line.split("|").map((part) => part.trim());
                        return { title, description, icon };
                    });
                }
                if (section.type === "faq") {
                    section.items = [...card.querySelectorAll(".faq-item-editor")].map((row) => ({
                        question: row.querySelector("[data-faq-question]").value.trim(),
                        answer: row.querySelector("[data-faq-answer]").value.trim()
                    })).filter((item) => item.question || item.answer);
                }
                return section;
            });
            return sections;
        }

        function updateBodySectionMoveButtons(container = bodySections) {
            const cards = [...container.querySelectorAll(":scope > .body-section")];
            cards.forEach((card, index) => {
                const buttons = card.querySelectorAll(".section-order button");
                if (buttons[0]) buttons[0].disabled = index === 0;
                if (buttons[1]) buttons[1].disabled = index === cards.length - 1;
            });
        }

        function moveBodySection(card, direction) {
            const cards = [...bodySections.querySelectorAll(":scope > .body-section")];
            const index = cards.indexOf(card);
            const targetIndex = index + direction;
            if (index < 0 || targetIndex < 0 || targetIndex >= cards.length) return;

            if (direction < 0) {
                bodySections.insertBefore(card, cards[targetIndex]);
            } else if (cards[targetIndex].nextSibling) {
                bodySections.insertBefore(card, cards[targetIndex].nextSibling);
            } else {
                bodySections.appendChild(card);
            }

            updateBodySectionMoveButtons();
            saveActiveBodyPage();
            refreshBodyPreview();
            scheduleAutosave();
            card.scrollIntoView({ block: "nearest", behavior: "smooth" });
        }

        function saveActiveBodyPage() {
            const page = bodyPages[activeBodyPageIndex];
            if (!page || document.getElementById("bodyPageEditor").hidden) return;
            const previousSlug = page.slug;
            const previousName = page.name;
            page.name = document.getElementById("bodyPageName").value.trim();
            page.slug = document.getElementById("bodyPageSlug").value.trim();
            page.sections = sectionsFromForm();
            linksList.querySelectorAll(".link-row").forEach((row) => {
                if (row.dataset.pageSlug !== previousSlug) return;
                const labelInput = row.querySelector(".link-label");
                const urlInput = row.querySelector(".link-url");
                if (labelInput.value === previousName) labelInput.value = page.name;
                if (page.slug !== previousSlug) {
                    const prefix = urlInput.value.startsWith("/") ? "/" : "#";
                    urlInput.value = `${prefix}${page.slug}`;
                }
                row.dataset.pageSlug = page.slug;
                row.querySelector(".edit-link").setAttribute("aria-label", "Редагувати сторінку");
            });
        }

        function removeBodyPage(pageIndex) {
            if (bodyPages.length <= 1) return;
            const page = bodyPages[pageIndex];
            if (!window.confirm(`Видалити сторінку «${page.name}» та всі її блоки?`)) return;
            saveActiveBodyPage();
            const removedSlug = page.slug;
            bodyPages.splice(pageIndex, 1);
            linksList.querySelectorAll(".link-row").forEach((row) => {
                if (row.dataset.pageSlug === removedSlug) row.remove();
            });
            if (activeBodyPageIndex > pageIndex) activeBodyPageIndex -= 1;
            else if (activeBodyPageIndex === pageIndex) {
                activeBodyPageIndex = Math.min(pageIndex, bodyPages.length - 1);
            }
            renderBodyPageEditor(activeBodyPageIndex);
            refreshBodyPreview();
            scheduleAutosave();
        }

        function renderBodyPageList(openPageIndex = -1) {
            const pageList = document.getElementById("bodyPageList");
            const editor = document.getElementById("bodyPageEditor");
            document.getElementById("bodyPageEditorParking").appendChild(editor);
            pageList.replaceChildren();
            editor.hidden = openPageIndex < 0;
            bodyPages.forEach((page, index) => {
                const card = document.createElement("article");
                card.className = "body-page-card";
                const header = document.createElement("div");
                header.className = "body-page-header";
                const toggle = document.createElement("button");
                toggle.className = "body-page-toggle";
                toggle.type = "button";
                const title = document.createElement("span");
                title.className = "body-page-title";
                title.textContent = page.name || `Сторінка ${index + 1}`;
                toggle.appendChild(title);
                toggle.setAttribute("aria-expanded", String(index === openPageIndex));
                toggle.setAttribute(
                    "aria-label",
                    `${index === openPageIndex ? "Згорнути" : "Розгорнути"} сторінку ${page.name || index + 1}`
                );
                const content = document.createElement("div");
                content.className = "body-page-content";
                content.hidden = index !== openPageIndex;
                const removeButton = document.createElement("button");
                removeButton.className = "remove-link";
                removeButton.type = "button";
                removeButton.textContent = "-";
                removeButton.disabled = bodyPages.length <= 1;
                removeButton.setAttribute("aria-label", `Видалити сторінку ${page.name || index + 1}`);
                removeButton.addEventListener("click", () => removeBodyPage(index));
                if (index === 0 || page.slug === "home") removeButton.hidden = true;
                toggle.addEventListener("click", () => {
                    if (index === activeBodyPageIndex && !editor.hidden) {
                        saveActiveBodyPage();
                        renderBodyPageEditor(-1);
                    } else {
                        saveActiveBodyPage();
                        activeBodyPageIndex = index;
                        renderBodyPageEditor(index);
                    }
                    refreshBodyPreview();
                });
                header.append(toggle, removeButton);
                card.append(header, content);
                pageList.appendChild(card);
                if (index === openPageIndex) content.appendChild(editor);
            });
        }

        function renderBodyPageEditor(openPageIndex = activeBodyPageIndex) {
            if (openPageIndex >= 0) {
                activeBodyPageIndex = openPageIndex;
                const page = bodyPages[openPageIndex];
                if (!page) return;
                document.getElementById("bodyPageName").value = page.name;
                document.getElementById("bodyPageSlug").value = page.slug;
                bodySections.replaceChildren();
                page.sections.forEach(addBodySection);
                updateBodySectionMoveButtons();
            }
            renderBodyPageList(openPageIndex);
        }

        function bodySettingsFromForm() {
            saveActiveBodyPage();
            return {
                template1: {
                    enabled: true,
                    background: document.getElementById("bodyBackground").value,
                    blockBackground: document.getElementById("bodyBlockBackground").value,
                    blockOpacity: document.getElementById("bodyBlockOpacity").value,
                    blockBlur: document.getElementById("bodyBlockBlur").value,
                    textColor: document.getElementById("bodyTextColor").value,
                    textGray: document.getElementById("bodyTextGray").value,
                    pages: bodyPages.map((page) => ({
                        name: page.name,
                        slug: page.slug,
                        sections: page.sections
                    }))
                }
            };
        }

        function settingsFromForm() {
            const data = new FormData(form);
            const links = [...linksList.querySelectorAll(".link-row")].map((row) => ({
                label: row.querySelector(".link-label").value.trim(),
                url: row.querySelector(".link-url").value.trim()
            })).filter((link) => link.label || link.url);
            return readSettings({
                header: {
                    logoType: data.get("logoType"),
                    logo: data.get("logo"),
                    logoText: data.get("logoText"),
                background: document.getElementById("headerBackground").value,
                backgroundOpacity: document.getElementById("headerBackgroundOpacity").value,
                backgroundBlur: document.getElementById("headerBackgroundBlur").value,
                    textColor: data.get("textColor"),
                    air: data.get("air") === "on",
                    fixed: data.get("fixed") === "on",
                    blackTheme: data.get("blackTheme") === "on",
                    telephoneEnabled: data.get("telephoneEnabled") === "on",
                    telephone: form.elements.telephone.value,
                    telephonePosition: data.get("telephonePosition"),
                    links
                },
                body: bodySettingsFromForm(),
                seo: {
                    title: document.getElementById("seoTitle").value,
                    description: document.getElementById("seoDescription").value,
                    keywords: document.getElementById("seoKeywords").value,
                    canonical: document.getElementById("seoCanonical").value,
                    robots: document.getElementById("seoRobots").value,
                    ogTitle: document.getElementById("seoOgTitle").value,
                    ogDescription: document.getElementById("seoOgDescription").value,
                    ogImage: document.getElementById("seoOgImage").value,
                    language: document.getElementById("geoLanguage").value,
                    generative: {
                        name: document.getElementById("geoName").value,
                        summary: document.getElementById("geoSummary").value,
                        audience: document.getElementById("geoAudience").value,
                        services: textList(document.getElementById("geoServices").value),
                        expertise: textList(document.getElementById("geoExpertise").value),
                        profiles: textList(document.getElementById("geoProfiles").value)
                    }
                }
            });
        }

        function updateForm(settings) {
            const header = settings.header;
            form.elements.logoType.value = header.logoType || "image";
            form.elements.logo.value = header.logo;
            form.elements.logoText.value = header.logoText || "";
            document.getElementById("logoImageField").hidden = form.elements.logoType.value !== "image";
            document.getElementById("logoTextField").hidden = form.elements.logoType.value !== "text";
            form.elements.textColor.value = header.textColor;
            document.getElementById("headerBackground").value = header.background;
            document.getElementById("headerBackgroundOpacity").value = header.backgroundOpacity;
            document.getElementById("headerBackgroundBlur").value = header.backgroundBlur;
            document.getElementById("headerBackgroundOpacityValue").textContent = `${header.backgroundOpacity}%`;
            document.getElementById("headerBackgroundBlurValue").textContent = `${header.backgroundBlur}px`;
            form.elements.air.checked = header.air === true;
            form.elements.fixed.checked = header.fixed === true;
            form.elements.blackTheme.checked = header.blackTheme === true;
            form.elements.telephoneEnabled.checked = header.telephoneEnabled === true;
            form.elements.telephone.value = header.telephone || "";
            form.elements.telephonePosition.value = header.telephonePosition || "before";
            form.elements.telephone.disabled = !form.elements.telephoneEnabled.checked;
            document.getElementById("telephoneField").hidden = !form.elements.telephoneEnabled.checked;
            const body = settings.body.template1;
            document.getElementById("bodyBackground").value = body.background;
            document.getElementById("bodyBlockBackground").value = body.blockBackground;
            document.getElementById("bodyBlockOpacity").value = body.blockOpacity;
            document.getElementById("bodyBlockBlur").value = body.blockBlur;
            document.getElementById("bodyBlockOpacityValue").textContent = `${body.blockOpacity}%`;
            document.getElementById("bodyBlockBlurValue").textContent = `${body.blockBlur}px`;
            document.getElementById("bodyTextColor").value = body.textColor;
            document.getElementById("bodyTextGray").value = body.textGray;
            const seo = settings.seo || DEFAULT_SETTINGS.seo;
            document.getElementById("seoTitle").value = seo.title || "";
            document.getElementById("seoDescription").value = seo.description || "";
            document.getElementById("seoKeywords").value = seo.keywords || "";
            document.getElementById("seoCanonical").value = seo.canonical || "";
            document.getElementById("seoRobots").value = seo.robots || "index, follow";
            document.getElementById("seoOgTitle").value = seo.ogTitle || "";
            document.getElementById("seoOgDescription").value = seo.ogDescription || "";
            document.getElementById("seoOgImage").value = seo.ogImage || "";
            const generative = seo.generative || {};
            document.getElementById("geoName").value = generative.name || "";
            document.getElementById("geoSummary").value = generative.summary || "";
            document.getElementById("geoAudience").value = generative.audience || "";
            document.getElementById("geoServices").value = (generative.services || []).join("\n");
            document.getElementById("geoExpertise").value = (generative.expertise || []).join("\n");
            document.getElementById("geoProfiles").value = (generative.profiles || []).join("\n");
            document.getElementById("geoLanguage").value = seo.language || generative.language || "uk";
            bodyPages = body.pages.map((page) => ({
                name: page.name,
                slug: page.slug,
                sections: page.sections
            }));
            const homePage = bodyPages[0];
            if (homePage && !homePage.sections.some((section) => section.type === "about")) {
                homePage.sections.push(emptyBodySection("about"));
            }
            if (homePage && !homePage.sections.some((section) => section.type === "contact")) {
                homePage.sections.push(emptyBodySection("contact"));
            }
            if (homePage && !homePage.sections.some((section) => section.type === "faq")) {
                homePage.sections.push(emptyBodySection("faq"));
            }
            linksList.replaceChildren();
            header.links.forEach((link) => addLinkRow(link));
            const homeSections = new Set(homePage?.sections.map((section) => section.type) || []);
            linksList.querySelectorAll(".link-row").forEach((row) => {
                const label = row.querySelector(".link-label").value.trim().toLowerCase();
                const urlInput = row.querySelector(".link-url");
                const sectionSlug = label === "about" || label === "contact" ? label : "";
                if (!sectionSlug || !homeSections.has(sectionSlug) ||
                    ![`#${sectionSlug}`, `/${sectionSlug}`].includes(urlInput.value)) return;
                urlInput.value = `#${sectionSlug}`;
                row.dataset.pageSlug = "";
                row.querySelector(".edit-link").setAttribute("aria-label", "Редагувати посилання");
            });
            addMissingPageLinks(bodyPages);
            activeBodyPageIndex = 0;
            renderBodyPageEditor(activeBodyPageIndex);
        }

        function emptyBodySection(type) {
            if (type === "hero") {
                return { type, enabled: true, eyebrow: "", title: "", subtitle: "", backgroundImage: "", buttonLabel: "", buttonUrl: "" };
            }
            if (type === "about") {
                return { type, enabled: true, eyebrow: "", title: "About", text: "", images: [], items: [], buttonLabel: "", buttonUrl: "" };
            }
            if (type === "contact") {
                return { type, enabled: true, title: "Contact", intro: "Напишіть або зателефонуйте нам.", phone: "", email: "", address: "", hours: "" };
            }
            if (type === "faq") {
                return {
                    type,
                    enabled: true,
                    title: "Common Questions",
                    items: [
                        { question: "Do you offer 24/7 emergency service?", answer: "" },
                        { question: "How often should I service my HVAC system?", answer: "" },
                        { question: "Are your technicians licensed and insured?", answer: "" },
                        { question: "Do you offer financing for new installations?", answer: "" }
                    ]
                };
            }
            return { type: "features", enabled: true, title: "", items: [] };
        }

        function refreshBodyPreview() {
            const body = bodySettingsFromForm().template1;
            bodyPreview.replaceChildren();
            if (preview) {
                const headerPreview = preview.cloneNode(true);
                headerPreview.removeAttribute("id");
                headerPreview.classList.remove("is-air");
                headerPreview.style.position = "relative";
                headerPreview.style.inset = "auto";
                bodyPreview.appendChild(headerPreview);
            }
            if (!body.enabled) {
                const message = document.createElement("div");
                message.textContent = "Генерацію блоків body вимкнено.";
                bodyPreview.appendChild(message);
            } else if (!body.pages[activeBodyPageIndex].sections.some((section) => section.enabled)) {
                const message = document.createElement("div");
                message.textContent = "Додайте та налаштуйте блоки сторінки.";
                bodyPreview.appendChild(message);
            } else {
                if (body.pages.length > 1) {
                    const switcher = document.createElement("label");
                    switcher.className = "generated-body__page-switcher";
                    switcher.append("Сторінка ");
                    const select = document.createElement("select");
                    select.setAttribute("aria-label", "Вибрати сторінку");
                    body.pages.forEach((page, pageIndex) => {
                        const option = document.createElement("option");
                        option.value = String(pageIndex);
                        option.textContent = page.name;
                        option.selected = pageIndex === activeBodyPageIndex;
                        select.appendChild(option);
                    });
                    select.addEventListener("change", () => {
                        saveActiveBodyPage();
                        const pageIndex = Number(select.value);
                        renderBodyPageEditor(pageIndex);
                        refreshBodyPreview();
                    });
                    switcher.appendChild(select);
                    bodyPreview.appendChild(switcher);
                }
                const pagePreview = document.createElement("div");
                pagePreview.innerHTML = generateBodyHtml(body, activeBodyPageIndex, false);
                bodyPreview.appendChild(pagePreview);
            }
        }

        function renderHeaderPreview(settings) {
            const header = settings.header;
            const background = header.blackTheme ? "#111111" : header.background;
            const textColor = header.blackTheme ? "#ffffff" : header.textColor;
            preview.replaceChildren();
            preview.classList.toggle("is-air", header.air);
            preview.style.background = hexToRgba(background, header.backgroundOpacity);
            preview.style.backdropFilter = `blur(${header.backgroundBlur}px)`;
            preview.style.webkitBackdropFilter = `blur(${header.backgroundBlur}px)`;
            preview.style.color = textColor;
            preview.style.borderColor = header.air ? "transparent" : "#e1e5ef";
            if (header.logoType === "text" && header.logoText) {
                const text = document.createElement("a");
                text.className = "preview-text-logo";
                text.href = "index.html";
                text.textContent = header.logoText;
                text.style.color = textColor;
                preview.appendChild(text);
            } else if (header.logo) {
                const image = document.createElement("img");
                image.src = header.logo;
                image.alt = "Логотип";
                const logoLink = document.createElement("a");
                logoLink.href = "index.html";
                logoLink.setAttribute("aria-label", "На головну");
                logoLink.appendChild(image);
                preview.appendChild(logoLink);
            }
            const nav = document.createElement("nav");
            nav.setAttribute("aria-label", "Основна навігація");
            header.links.forEach((link) => {
                const anchor = document.createElement("a");
                anchor.href = link.url;
                anchor.textContent = link.label;
                anchor.style.color = textColor;
                nav.appendChild(anchor);
            });
            const phoneMarkupPreview = () => {
                const phone = document.createElement("a");
                phone.className = "preview-phone";
                phone.href = `tel:${header.telephone.replace(/[^\d+]/g, "")}`;
                phone.textContent = header.telephone;
                phone.style.color = textColor;
                return phone;
            };
            if (header.telephoneEnabled && header.telephonePosition !== "after") {
                preview.appendChild(phoneMarkupPreview());
            }
            preview.appendChild(nav);
            if (header.telephoneEnabled && header.telephonePosition === "after") {
                preview.appendChild(phoneMarkupPreview());
            }
            const modes = [];
            if (header.air) modes.push("Air: прозора шапка поверх наступного блоку");
            if (header.fixed) modes.push("Fixed: закріплена зверху");
            if (!modes.length) modes.push("Звичайний режим");
            previewMode.textContent = `Попередній перегляд: ${modes.join(" · ")}${header.telephoneEnabled ? ` · телефон ${header.telephonePosition === "after" ? "після" : "перед"} меню` : ""}`;
        }

        function generateSitePage(settings, pageIndex) {
            const header = settings.header;
            const background = header.blackTheme ? "#111111" : header.background;
            const textColor = header.blackTheme ? "#ffffff" : header.textColor;
            const logoMarkup = header.logoType === "text"
                ? (header.logoText
                    ? `  <a class="generated-header__logo generated-header__logo--text" href="index.html" aria-label="На головну">${escapeHtml(header.logoText)}</a>\n`
                    : "")
                : (header.logo
                    ? `  <a class="generated-header__logo" href="index.html" aria-label="На головну">\n    <img src="${escapeHtml(header.logo)}" alt="Логотип">\n  </a>\n`
                    : "");
            const phoneMarkup = header.telephoneEnabled
                ? `  <a class="generated-header__phone" href="tel:${escapeHtml(header.telephone.replace(/[^\d+]/g, ""))}">${escapeHtml(header.telephone)}</a>\n`
                : "";
            const position = header.fixed ? "fixed" : header.air ? "absolute" : "relative";
            const generatedBackground = hexToRgba(background, header.backgroundOpacity);
            const body = settings.body.template1;
            const pageFileForSlug = (slug) => {
                const pageIndexForSlug = body.pages.findIndex((page) => page.slug === slug);
                if (pageIndexForSlug < 0) return "";
                return generatedPageFileName(body, pageIndexForSlug);
            };
            const linkMarkup = header.links.map((link) => {
                const pageFile = pageFileForSlug(pageSlugFromUrl(link.url));
                const href = pageFile || link.url;
                return `    <a href="${escapeHtml(href)}">${escapeHtml(link.label)}</a>`;
            }
            ).join("\n");
            const headerMarkup = `<style>
.generated-header {
  box-sizing: border-box;
  position: ${position};
  ${header.air || header.fixed ? "top: 0; left: 0; right: 0;" : ""}
  z-index: 1000;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 16px 24px;
  background: ${generatedBackground};
  backdrop-filter: blur(${header.backgroundBlur}px);
  -webkit-backdrop-filter: blur(${header.backgroundBlur}px);
  color: ${textColor};
}
.generated-header__logo img { display: block; max-width: 150px; max-height: 44px; width: auto; object-fit: contain; }
.generated-header__logo--text { color: inherit; font-size: 1.25rem; font-weight: 800; text-decoration: none; }
.generated-header__phone, .generated-header__nav a { color: inherit; text-decoration: none; }
.generated-header__nav { display: flex; flex-wrap: wrap; gap: 18px; }
@media (max-width: 640px) {
  .generated-header { flex-direction: column; align-items: flex-start; gap: 12px; padding: 14px 16px; }
  .generated-header__nav { width: 100%; gap: 12px 16px; }
}
</style>
<header class="generated-header">
${logoMarkup}${header.telephoneEnabled && header.telephonePosition !== "after" ? phoneMarkup : ""}  <nav class="generated-header__nav" aria-label="Основна навігація">
${linkMarkup}
  </nav>
${header.telephoneEnabled && header.telephonePosition === "after" ? phoneMarkup : ""}
</header>`;
  const bodyMarkup = generateBodyHtml(body, pageIndex, false);
  const pageTitle = body.pages[pageIndex]?.name || "Сайт";
  const seo = settings.seo;
  const generative = seo.generative;
  const seoTitle = seo.title || pageTitle;
  const seoDescription = seo.description ? `\n  <meta name="description" content="${escapeHtml(seo.description)}">` : "";
  const seoKeywords = seo.keywords ? `\n  <meta name="keywords" content="${escapeHtml(seo.keywords)}">` : "";
  const seoRobots = seo.robots ? `\n  <meta name="robots" content="${escapeHtml(seo.robots)}">` : "";
  const canonical = seo.canonical ? `\n  <link rel="canonical" href="${escapeHtml(seo.canonical)}">` : "";
  const ogTitle = seo.ogTitle || seoTitle;
  const ogDescription = seo.ogDescription || seo.description;
  const ogImage = seo.ogImage ? `\n  <meta property="og:image" content="${escapeHtml(seo.ogImage)}">` : "";
  const openGraph = `\n  <meta property="og:title" content="${escapeHtml(ogTitle)}">${ogDescription ? `\n  <meta property="og:description" content="${escapeHtml(ogDescription)}">` : ""}${ogImage}`;
  const language = generative.language || "uk";
  const canonicalUrl = /^https?:\/\//i.test(seo.canonical) ? seo.canonical : "";
  const schemaBaseUrl = canonicalUrl.replace(/#.*$/, "");
  const organizationId = `${schemaBaseUrl}#organization`;
  const structuredGraph = [];
  if (generative.name) {
      const organization = {
          "@type": "Organization",
          "@id": organizationId,
          name: generative.name
      };
      if (generative.summary) organization.description = generative.summary;
      if (canonicalUrl) organization.url = canonicalUrl;
      if (generative.audience) organization.audience = { "@type": "Audience", audienceType: generative.audience };
      const expertise = [...generative.services, ...generative.expertise];
      if (expertise.length) organization.knowsAbout = expertise;
      if (generative.profiles.length) organization.sameAs = generative.profiles;
      if (generative.services.length) {
          organization.hasOfferCatalog = {
              "@type": "OfferCatalog",
              name: "Послуги",
              itemListElement: generative.services.map((service) => ({
                  "@type": "Offer",
                  itemOffered: { "@type": "Service", name: service }
              }))
          };
      }
      structuredGraph.push(organization);
  }
  if (generative.name || seo.title || canonicalUrl) {
      const website = {
          "@type": "WebSite",
          "@id": `${schemaBaseUrl}#website`,
          name: generative.name || seo.title || pageTitle
      };
      if (canonicalUrl) website.url = canonicalUrl;
      if (language) website.inLanguage = language;
      if (generative.name) website.publisher = { "@id": organizationId };
      structuredGraph.push(website);
  }
  const generativeStructuredData = structuredGraph.length
      ? `\n  <script type="application/ld+json">${JSON.stringify({
          "@context": "https://schema.org",
          "@graph": structuredGraph
      }).replace(/</g, "\\u003c")}<\/script>`
      : "";
  return `<!doctype html>
<html lang="${escapeHtml(language)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(seoTitle)}</title>${seoDescription}${seoKeywords}${seoRobots}${canonical}${openGraph}${generativeStructuredData}
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    html, body { min-height: 100%; margin: 0; }
    body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
  </style>
</head>
<body>
${headerMarkup}
${bodyMarkup}
</body>
</html>`;
        }

        function render(settings) {
            renderHeaderPreview(settings);
            refreshBodyPreview();
        }

        function generateBodyHtml(body, onlyPageIndex = null, includePageSwitcher = true) {
  if (!body.enabled) return "";
  const pages = onlyPageIndex === null ? body.pages : body.pages.slice(onlyPageIndex, onlyPageIndex + 1);
  if (!pages.length) return "";

  const markup = pages.map((page, renderIndex) => {
      const sections = page.sections.filter((section) => section.enabled);
      const sectionMarkup = sections.map((section) => {
      if (section.type === "hero") {
          const image = section.backgroundImage
              ? `\n  <img class="generated-body__hero-image" src="${escapeHtml(section.backgroundImage)}" alt="" loading="lazy">`
              : "";
          const button = section.buttonLabel && section.buttonUrl
              ? `\n    <a class="generated-body__button" href="${escapeHtml(section.buttonUrl)}">${escapeHtml(section.buttonLabel)}</a>`
              : "";
          const eyebrow = section.eyebrow
              ? `\n    <p class="generated-body__eyebrow">${escapeHtml(section.eyebrow)}</p>`
              : "";
          const subtitle = section.subtitle
              ? `\n    <p class="generated-body__description">${escapeHtml(section.subtitle)}</p>`
              : "";
          return `<section class="generated-body__hero" style="background:${hexToRgba(body.blockBackground, body.blockOpacity)};color:${body.textColor};backdrop-filter:blur(${body.blockBlur}px);">${image}
  <div class="generated-body__hero-overlay"></div>
  <div class="generated-body__hero-content">${eyebrow}
    <h1>${escapeHtml(section.title)}</h1>${subtitle}${button}
  </div>
</section>`;
      }
      if (section.type === "about") {
          const images = section.images.map((image, index) =>
              `    <img src="${escapeHtml(image)}" alt="" loading="lazy"${index === 0 ? ' class="generated-body__about-main-image"' : ""}>`
          ).join("\n");
          const bullets = section.items.map((item) =>
              `      <li>${escapeHtml(item)}</li>`
          ).join("\n");
          const button = section.buttonLabel && section.buttonUrl
              ? `\n    <a class="generated-body__button" href="${escapeHtml(section.buttonUrl)}">${escapeHtml(section.buttonLabel)}</a>`
              : "";
          const eyebrow = section.eyebrow
              ? `\n    <p class="generated-body__eyebrow">${escapeHtml(section.eyebrow)}</p>`
              : "";
          const text = section.text
              ? `\n    <p class="generated-body__description">${escapeHtml(section.text)}</p>`
              : "";
          const imageMarkup = images
              ? `\n  <div class="generated-body__about-images">\n${images}\n  </div>`
              : "";
          const list = bullets
              ? `\n    <ul class="generated-body__checklist">\n${bullets}\n    </ul>`
              : "";
          return `<section class="generated-body__about" id="about" style="background:${hexToRgba(body.blockBackground, body.blockOpacity)};color:${body.textColor};backdrop-filter:blur(${body.blockBlur}px);">${imageMarkup}
  <div class="generated-body__about-content">${eyebrow}
    <h2>${escapeHtml(section.title)}</h2>${text}${list}${button}
  </div>
</section>`;
      }
      if (section.type === "contact") {
          const details = [
              section.phone
                  ? `<a class="generated-body__contact-card" href="tel:${escapeHtml(section.phone.replace(/[^\d+]/g, ""))}"><span>Телефон</span><strong>${escapeHtml(section.phone)}</strong></a>`
                  : "",
              section.email
                  ? `<a class="generated-body__contact-card" href="mailto:${escapeHtml(section.email)}"><span>Email</span><strong>${escapeHtml(section.email)}</strong></a>`
                  : "",
              section.address
                  ? `<div class="generated-body__contact-card"><span>Адреса</span><strong>${escapeHtml(section.address)}</strong></div>`
                  : "",
              section.hours
                  ? `<div class="generated-body__contact-card"><span>Графік роботи</span><strong>${escapeHtml(section.hours)}</strong></div>`
                  : ""
          ].filter(Boolean).join("\n");
          const intro = section.intro
              ? `\n    <p class="generated-body__description">${escapeHtml(section.intro)}</p>`
              : "";
          return `<section class="generated-body__contact" id="contact" style="background:${hexToRgba(body.blockBackground, body.blockOpacity)};color:${body.textColor};backdrop-filter:blur(${body.blockBlur}px);">
  <div class="generated-body__contact-inner">
    <p class="generated-body__eyebrow">Contact</p>
    <h2>${escapeHtml(section.title)}</h2>${intro}
    ${details ? `<div class="generated-body__contact-grid">${details}</div>` : ""}
  </div>
</section>`;
      }
      if (section.type === "faq") {
          const items = section.items.map((item) => `<details class="generated-body__faq-item">
  <summary>${escapeHtml(item.question)}<span aria-hidden="true"></span></summary>
  ${item.answer ? `<p>${escapeHtml(item.answer)}</p>` : ""}
</details>`).join("\n");
          return `<section class="generated-body__faq" style="background:${hexToRgba(body.blockBackground, body.blockOpacity)};color:${body.textColor};backdrop-filter:blur(${body.blockBlur}px);">
  <h2>${escapeHtml(section.title)}</h2>
  <div class="generated-body__faq-list">
${items}
  </div>
</section>`;
      }
      const items = section.items.map((item) => {
          const icon = item.icon
              ? `\n      <img src="${escapeHtml(item.icon)}" alt="" loading="lazy">`
              : "";
          return `    <article class="generated-body__feature">${icon}
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.description)}</p>
    </article>`;
      }).join("\n");
      return `<section class="generated-body__features" style="background:${hexToRgba(body.blockBackground, body.blockOpacity)};color:${body.textColor};backdrop-filter:blur(${body.blockBlur}px);">
  <h2>${escapeHtml(section.title)}</h2>
  <div class="generated-body__feature-grid">\n${items}\n  </div>
</section>`;
      }).join("\n\n");
      const pageHidden = onlyPageIndex === null && renderIndex > 0 ? " hidden" : "";
      return `<main class="generated-body__page" id="${escapeHtml(page.slug)}" data-generated-page="${escapeHtml(page.slug)}"${pageHidden}>
${sectionMarkup}
</main>`;
  }).join("\n");
  const faqEntities = pages.flatMap((page) => page.sections
      .filter((section) => section.enabled && section.type === "faq")
      .flatMap((section) => section.items
          .filter((item) => item.question && item.answer)
          .map((item) => ({
              "@type": "Question",
              name: item.question,
              acceptedAnswer: {
                  "@type": "Answer",
                  text: item.answer
              }
          }))));
  const faqStructuredData = faqEntities.length
      ? `<script type="application/ld+json">${JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqEntities
      }).replace(/</g, "\\u003c")}<\/script>`
      : "";
  const pageSwitcher = includePageSwitcher && onlyPageIndex === null && body.pages.length > 1
      ? `<label class="generated-body__page-switcher">Сторінка
  <select data-generated-page-switcher aria-label="Вибрати сторінку">
${body.pages.map((page) => `    <option value="${escapeHtml(page.slug)}">${escapeHtml(page.name)}</option>`).join("\n")}
  </select>
</label>`
      : "";
  const pageScript = pageSwitcher
      ? `<script>
document.querySelector("[data-generated-page-switcher]").addEventListener("change", (event) => {
  showGeneratedPage(event.target.value);
  history.replaceState(null, "", "#" + event.target.value);
});
const generatedPages = [...document.querySelectorAll("[data-generated-page]")];
function showGeneratedPage(slug) {
  const selectedPage = generatedPages.find((page) => page.dataset.generatedPage === slug);
  if (!selectedPage) return false;
  document.querySelector("[data-generated-page-switcher]").value = slug;
  generatedPages.forEach((page) => { page.hidden = page !== selectedPage; });
  return true;
}
window.addEventListener("hashchange", () => {
  showGeneratedPage(decodeURIComponent(location.hash.slice(1)));
});
if (!showGeneratedPage(decodeURIComponent(location.hash.slice(1)))) {
  showGeneratedPage(generatedPages[0].dataset.generatedPage);
}
<\/script>`
      : "";

  return `<style>
.generated-body, .generated-body * { box-sizing: border-box; }
.generated-body { width: 100%; font-family: inherit; background: ${body.background}; --body-text-gray: ${body.textGray}; }
.generated-body__page[hidden] { display: none; }
.generated-body__page-switcher { display: flex; align-items: center; gap: 10px; padding: 14px 24px; background: #f3f5fa; color: #202334; font-weight: 600; }
.generated-body__page-switcher select { min-width: 180px; padding: 9px 12px; border: 1px solid #cbd1df; border-radius: 7px; color: inherit; background: #fff; font: inherit; }
.generated-body__hero { position: relative; display: flex; align-items: center; min-height: 420px; overflow: hidden; padding: clamp(32px, 8vw, 100px); }
.generated-body__hero-image, .generated-body__hero-overlay { position: absolute; inset: 0; width: 100%; height: 100%; }
.generated-body__hero-image { object-fit: cover; }
.generated-body__hero-overlay { background: linear-gradient(90deg, rgba(0,0,0,.58), rgba(0,0,0,.18)); }
.generated-body__hero-content { position: relative; z-index: 1; width: min(100%, 560px); margin-inline: auto; }
.generated-body__hero h1, .generated-body__about h2, .generated-body__contact h2, .generated-body__features h2 { margin: 0 0 16px; font-size: clamp(1.8rem, 3.5vw, 3rem); line-height: 1.12; }
.generated-body__eyebrow { margin: 0 0 12px; color: var(--body-text-gray); font-size: .75rem; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; }
.generated-body__description { margin: 0 0 24px; max-width: 620px; color: var(--body-text-gray); line-height: 1.65; }
.generated-body__button { display: inline-flex; align-items: center; justify-content: center; min-height: 44px; padding: 11px 22px; border-radius: 999px; background: #28578f; color: #fff; font-size: .8rem; font-weight: 800; text-decoration: none; text-transform: uppercase; }
.generated-body__hero .generated-body__button { background: #fff; color: #142238; }
.generated-body__about { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); align-items: center; gap: clamp(28px, 6vw, 76px); padding: clamp(32px, 7vw, 88px); }
.generated-body__about-images { display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 14px; align-items: center; }
.generated-body__about-images img { display: block; width: 100%; height: clamp(120px, 16vw, 210px); object-fit: cover; border-radius: 12px; }
.generated-body__about-main-image { grid-row: span 2; height: clamp(220px, 26vw, 340px) !important; }
.generated-body__about-images img:only-child { grid-column: 1 / -1; grid-row: 1 / -1; height: clamp(220px, 30vw, 380px); }
.generated-body__about-content { max-width: 600px; }
.generated-body__contact { padding: clamp(32px, 7vw, 88px); }
.generated-body__contact-inner { max-width: 1120px; margin: 0 auto; }
.generated-body__contact-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr)); gap: 14px; margin-top: 28px; }
.generated-body__contact-card { display: grid; gap: 9px; min-height: 104px; padding: 20px; border: 1px solid rgba(20,34,56,.12); border-radius: 12px; background: rgba(255,255,255,.78); color: inherit; text-decoration: none; overflow-wrap: anywhere; }
.generated-body__contact-card span { color: #657087; font-size: .78rem; font-weight: 750; letter-spacing: .08em; text-transform: uppercase; }
.generated-body__contact-card strong { font-size: 1rem; line-height: 1.5; }
.generated-body__checklist { display: grid; gap: 12px; margin: 24px 0; padding: 0; list-style: none; }
.generated-body__checklist li { line-height: 1.5; }
.generated-body__checklist li::before { content: "✓"; margin-right: 9px; font-weight: 800; }
.generated-body__faq { max-width: 100%; padding: clamp(32px, 5vw, 64px) clamp(20px, 12vw, 280px); }
.generated-body__faq h2 { max-width: 760px; margin: 0 auto 24px; font-size: clamp(1.8rem, 3vw, 2.8rem); line-height: 1.1; text-align: center; }
.generated-body__faq-list { max-width: 760px; margin: 0 auto; display: grid; gap: 12px; }
.generated-body__faq-item { overflow: hidden; border: 1px solid #dfe3ea; border-radius: 8px; background: #fff; }
.generated-body__faq-item summary { display: flex; align-items: center; justify-content: space-between; gap: 16px; min-height: 68px; padding: 18px 20px; cursor: pointer; list-style: none; font-weight: 750; }
.generated-body__faq-item summary::-webkit-details-marker { display: none; }
.generated-body__faq-item summary span { position: relative; flex: 0 0 20px; width: 20px; height: 20px; border-radius: 50%; background: #edf2ff; }
.generated-body__faq-item summary span::before, .generated-body__faq-item summary span::after { content: ""; position: absolute; top: 9px; left: 6px; width: 8px; height: 2px; background: #28578f; }
.generated-body__faq-item summary span::after { transform: rotate(90deg); transition: transform .2s ease; }
.generated-body__faq-item[open] summary span::after { transform: rotate(0); }
.generated-body__faq-item p { margin: 0; padding: 0 20px 18px; color: #657087; line-height: 1.65; }
.generated-body__features { padding: clamp(32px, 7vw, 88px); }
.generated-body__feature-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; }
.generated-body__feature { padding: 22px; border-radius: 12px; background: rgba(255,255,255,.72); }
.generated-body__feature img { width: 42px; height: 42px; object-fit: contain; }
.generated-body__feature h3 { margin: 12px 0 8px; }
.generated-body__feature p { margin: 0; line-height: 1.55; }
@media (max-width: 700px) {
  .generated-body__hero { min-height: 340px; }
  .generated-body__about { grid-template-columns: 1fr; }
  .generated-body__about-images { max-width: 520px; }
  .generated-body__feature-grid { grid-template-columns: minmax(0, 1fr); }
  .generated-body__feature { min-width: 0; }
  .generated-body__faq { padding: 32px 16px; }
  .generated-body__faq-item summary { min-height: 58px; padding: 14px 16px; }
}
</style>
<div class="generated-body" style="background:${body.background};--body-text-gray:${body.textGray};">
${pageSwitcher}
${markup}
</div>
${pageScript}
${faqStructuredData}`;
        }

        function renderBody(settings) {
            const body = settings.body.template1;
            const bodyMarkup = generateBodyHtml(body);
            refreshBodyPreview();
            return bodyMarkup;
        }

        function setStatus(message, isError = false) {
            status.textContent = message;
            status.classList.toggle("error", isError);
        }

        function scheduleAutosave() {
            window.clearTimeout(autosaveTimer);
            autosaveTimer = window.setTimeout(() => {
                autosaveTimer = null;
                try {
                    const settings = settingsFromForm();
                    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(settings));
                    render(settings);
                    setStatus("Зміни автоматично збережено у цьому браузері.");
                } catch (error) {
                    setStatus(`Автозбереження не виконано: ${error.message}`, true);
                }
            }, 350);
        }

        function encodeCookieValue(value) {
            const bytes = new TextEncoder().encode(value);
            let binary = "";
            bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
            const encoded = btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
            return `b64.${encoded}`;
        }

        function decodeCookieValue(value) {
            if (!value.startsWith("b64.")) {
                try {
                    return decodeURIComponent(value);
                } catch {
                    return value;
                }
            }
            try {
                const base64 = value.slice(4).replace(/-/g, "+").replace(/_/g, "/");
                const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
                const binary = atob(padded);
                const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
                return new TextDecoder().decode(bytes);
            } catch {
                return value;
            }
        }

        function getCookie(name) {
            const prefix = `${name}=`;
            const item = document.cookie.split("; ").find((cookie) => cookie.startsWith(prefix));
            return item ? decodeCookieValue(item.slice(prefix.length)) : null;
        }

        async function initialize() {
            let settings;
            let settingsFileError = null;
            try {
                const autosaved = localStorage.getItem(AUTOSAVE_KEY);
                if (autosaved) settings = readSettings(JSON.parse(autosaved));
            } catch (error) {
                setStatus(`Не вдалося прочитати автозбереження: ${error.message}`, true);
            }
            if (!settings) {
                try {
                    const response = await fetch("./setting.json", { cache: "no-store" });
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    settings = readSettings(await response.json());
                } catch (error) {
                    settingsFileError = error;
                }
            }
            if (!settings) {
                try {
                    const saved = getCookie(COOKIE_NAME);
                    if (saved) settings = readSettings(JSON.parse(saved));
                } catch (error) {
                    setStatus(`Не вдалося прочитати збережені налаштування: ${error.message}`, true);
                }
            }
            if (!settings) {
                settings = DEFAULT_SETTINGS;
                if (settingsFileError) {
                    setStatus(`Не вдалося завантажити setting.json (${settingsFileError.message}); використано вбудовані налаштування.`, true);
                }
            }
            updateForm(settings);
            render(settingsFromForm());
        }

        form.addEventListener("submit", (event) => {
            event.preventDefault();
            try {
                const settings = settingsFromForm();
                const json = JSON.stringify(settings);
                localStorage.setItem(AUTOSAVE_KEY, json);
                const cookieValue = encodeCookieValue(json);
                if (new TextEncoder().encode(`${COOKIE_NAME}=${cookieValue}`).length > COOKIE_MAX_BYTES) {
                    throw new Error("Налаштування завеликі для cookie. Скоротіть кількість або довжину посилань.");
                }
                const secure = location.protocol === "https:" ? "; Secure" : "";
                document.cookie = `${COOKIE_NAME}=${cookieValue}; Path=/; Max-Age=2592000; SameSite=Lax${secure}`;
                const saved = getCookie(COOKIE_NAME);
                if (saved !== json) throw new Error("Браузер не зберіг cookie. Перевірте налаштування cookie для цієї сторінки.");
                render(readSettings(JSON.parse(saved)));
                setStatus("Налаштування збережені, HTML згенеровано.");
            } catch (error) {
                setStatus(error.message, true);
            }
        });

        document.addEventListener("input", (event) => {
            if (event.target.matches("input, textarea")) scheduleAutosave();
        });
        document.addEventListener("change", (event) => {
            if (event.target.matches("input, textarea, select")) scheduleAutosave();
        });
        document.getElementById("clearAutosave").addEventListener("click", async () => {
            if (!window.confirm("Видалити всі збережені налаштування та завантажити початкові?")) return;
            try {
                window.clearTimeout(autosaveTimer);
                autosaveTimer = null;
                localStorage.removeItem(AUTOSAVE_KEY);
                const secure = location.protocol === "https:" ? "; Secure" : "";
                document.cookie = `${COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
                await initialize();
                setStatus("Збереження видалено; завантажено початкові налаштування.");
            } catch (error) {
                setStatus(`Не вдалося видалити збереження: ${error.message}`, true);
            }
        });

        document.getElementById("addBodySection").addEventListener("click", () => {
            if (document.getElementById("bodyPageEditor").hidden) {
                renderBodyPageEditor(activeBodyPageIndex);
            }
            saveActiveBodyPage();
            bodyPages[activeBodyPageIndex].sections.push(
                emptyBodySection(document.getElementById("newBodySection").value)
            );
            renderBodyPageEditor();
            refreshBodyPreview();
            scheduleAutosave();
        });
        document.getElementById("addBodyPage").addEventListener("click", () => {
            saveActiveBodyPage();
            let pageNumber = bodyPages.length + 1;
            while (bodyPages.some((page) => page.slug === `page-${pageNumber}`)) pageNumber += 1;
            const page = {
                name: `Нова сторінка ${pageNumber}`,
                slug: `page-${pageNumber}`,
                sections: []
            };
            bodyPages.push(page);
            addLinkRow({ label: page.name, url: `#${page.slug}` }, page.slug);
            activeBodyPageIndex = bodyPages.length - 1;
            renderBodyPageEditor(activeBodyPageIndex);
            refreshBodyPreview();
            scheduleAutosave();
        });
        document.getElementById("bodyPageName").addEventListener("input", (event) => {
            const pageCard = document.getElementById("bodyPageList").children[activeBodyPageIndex];
            const title = pageCard?.querySelector(".body-page-title");
            const toggle = pageCard?.querySelector(".body-page-toggle");
            if (title && toggle) {
                title.textContent = event.target.value.trim() || `Сторінка ${activeBodyPageIndex + 1}`;
                toggle.setAttribute("aria-label", `Згорнути сторінку ${title.textContent}`);
            }
        });
        form.elements.telephoneEnabled.addEventListener("change", (event) => {
            form.elements.telephone.disabled = !event.target.checked;
            document.getElementById("telephoneField").hidden = !event.target.checked;
        });
        form.elements.logoType.addEventListener("change", (event) => {
            const isText = event.target.value === "text";
            document.getElementById("logoImageField").hidden = isText;
            document.getElementById("logoTextField").hidden = !isText;
            render(settingsFromForm());
        });
        form.elements.logoText.addEventListener("input", () => render(settingsFromForm()));
        form.elements.logo.addEventListener("input", () => render(settingsFromForm()));
        form.elements.telephonePosition.addEventListener("change", () => render(settingsFromForm()));
        [
            ["headerBackground", null, null],
            ["headerBackgroundOpacity", "headerBackgroundOpacityValue", "%"],
            ["headerBackgroundBlur", "headerBackgroundBlurValue", "px"],
            ["bodyBlockOpacity", "bodyBlockOpacityValue", "%"],
            ["bodyBlockBlur", "bodyBlockBlurValue", "px"]
        ].forEach(([inputId, outputId, suffix]) => {
            const input = document.getElementById(inputId);
            if (!input) return;
            input.addEventListener("input", () => {
                if (outputId) document.getElementById(outputId).textContent = `${input.value}${suffix}`;
                render(settingsFromForm());
                refreshBodyPreview();
            });
        });
        ["headerBackground", "bodyBlockBackground", "bodyTextGray"].forEach((inputId) => {
            const input = document.getElementById(inputId);
            if (input) input.addEventListener("input", () => {
                render(settingsFromForm());
                refreshBodyPreview();
            });
        });
        function createSiteZip(files) {
            const encoder = new TextEncoder();
            const crc32 = (bytes) => {
                let crc = 0xffffffff;
                bytes.forEach((byte) => {
                    crc ^= byte;
                    for (let bit = 0; bit < 8; bit += 1) {
                        crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
                    }
                });
                return (crc ^ 0xffffffff) >>> 0;
            };
            const header = (length, write) => {
                const bytes = new Uint8Array(length);
                write(new DataView(bytes.buffer));
                return bytes;
            };
            const localParts = [];
            const centralParts = [];
            let localOffset = 0;
            files.forEach(({ name, content }) => {
                const nameBytes = encoder.encode(name);
                const contentBytes = encoder.encode(content);
                const checksum = crc32(contentBytes);
                const localHeader = header(30 + nameBytes.length, (view) => {
                    view.setUint32(0, 0x04034b50, true);
                    view.setUint16(4, 20, true);
                    view.setUint16(6, 0x0800, true);
                    view.setUint16(8, 0, true);
                    view.setUint16(10, 0, true);
                    view.setUint16(12, 0x21, true);
                    view.setUint32(14, checksum, true);
                    view.setUint32(18, contentBytes.length, true);
                    view.setUint32(22, contentBytes.length, true);
                    view.setUint16(26, nameBytes.length, true);
                    view.setUint16(28, 0, true);
                    new Uint8Array(view.buffer, 30).set(nameBytes);
                });
                localParts.push(localHeader, contentBytes);

                const centralHeader = header(46 + nameBytes.length, (view) => {
                    view.setUint32(0, 0x02014b50, true);
                    view.setUint16(4, 20, true);
                    view.setUint16(6, 20, true);
                    view.setUint16(8, 0x0800, true);
                    view.setUint16(10, 0, true);
                    view.setUint16(12, 0, true);
                    view.setUint16(14, 0x21, true);
                    view.setUint32(16, checksum, true);
                    view.setUint32(20, contentBytes.length, true);
                    view.setUint32(24, contentBytes.length, true);
                    view.setUint16(28, nameBytes.length, true);
                    view.setUint16(30, 0, true);
                    view.setUint16(32, 0, true);
                    view.setUint16(34, 0, true);
                    view.setUint16(36, 0, true);
                    view.setUint32(38, 0, true);
                    view.setUint32(42, localOffset, true);
                    new Uint8Array(view.buffer, 46).set(nameBytes);
                });
                centralParts.push(centralHeader);
                localOffset += localHeader.length + contentBytes.length;
            });
            const centralSize = centralParts.reduce((size, part) => size + part.length, 0);
            const endRecord = header(22, (view) => {
                view.setUint32(0, 0x06054b50, true);
                view.setUint16(4, 0, true);
                view.setUint16(6, 0, true);
                view.setUint16(8, files.length, true);
                view.setUint16(10, files.length, true);
                view.setUint32(12, centralSize, true);
                view.setUint32(16, localOffset, true);
                view.setUint16(20, 0, true);
            });
            return new Blob([...localParts, ...centralParts, endRecord], { type: "application/zip" });
        }

        document.getElementById("downloadSiteHtml").addEventListener("click", () => {
            try {
                const settings = settingsFromForm();
                const pages = settings.body.template1.pages;
                const files = pages.map((page, pageIndex) => ({
                    name: generatedPageFileName(settings.body.template1, pageIndex),
                    content: generateSitePage(settings, pageIndex)
                }));
                const blob = createSiteZip(files);
                const url = URL.createObjectURL(blob);
                const anchor = document.createElement("a");
                anchor.href = url;
                anchor.download = "site-pages.zip";
                anchor.click();
                window.setTimeout(() => URL.revokeObjectURL(url), 1000);
                setStatus(`ZIP-архів завантажено: ${files.length} HTML-сторінок.`);
            } catch (error) {
                setStatus(error.message, true);
            }
        });
        document.getElementById("downloadSettingsJson").addEventListener("click", () => {
            try {
                const settings = settingsFromForm();
                const json = JSON.stringify(settings, null, 2);
                const blob = new Blob([json], { type: "application/json;charset=utf-8" });
                const url = URL.createObjectURL(blob);
                const anchor = document.createElement("a");
                anchor.href = url;
                anchor.download = "setting.json";
                anchor.click();
                URL.revokeObjectURL(url);
                localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(settings));
                setStatus("Файл setting.json завантажено.");
            } catch (error) {
                setStatus(error.message, true);
            }
        });
        document.getElementById("uploadSettingsJson").addEventListener("click", () => {
            document.getElementById("settingsJsonFile").click();
        });
        document.getElementById("settingsJsonFile").addEventListener("change", async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            try {
                const parsed = JSON.parse(await file.text());
                const settings = readSettings(parsed);
                updateForm(settings);
                render(settings);
                scheduleAutosave();
                setStatus(`Налаштування завантажено з ${file.name}.`);
            } catch (error) {
                setStatus(`Не вдалося завантажити налаштування: ${error.message}`, true);
            } finally {
                event.target.value = "";
            }
        });

        initialize();