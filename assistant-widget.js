(() => {
  "use strict";

  const config = window.LenaAssistantConfig || {};
  const rootPath = document.currentScript?.src
    ? new URL(".", document.currentScript.src).href
    : "";
  const asset = (name) => `${rootPath}assets/assistant/${name}`;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const locale = (document.documentElement.lang || "fa").split("-")[0].toLowerCase();
  const copy = {
    fa: {
      prompts: [
        { label: "انتخاب خدمات", value: "برای انتخاب خدمت مناسب راهنمایی می‌خواهم." },
        { label: "مراقبت‌های بعد", value: "مراقبت‌های بعد از خدمات آرایش دائم چیست؟" },
        { label: "رزرو مشاوره", value: "چطور می‌توانم وقت مشاوره رزرو کنم؟" }
      ],
      nudge: "برای انتخاب خدمات راهنمایی می‌خوای؟",
      closeNudge: "بستن پیام",
      assistant: "دستیار هوشمند لنا",
      clinic: "دستیار هوشمند کلینیک",
      brand: "لنا",
      ready: "آماده راهنمایی",
      closeChat: "بستن گفتگو",
      firstConsultation: "مشاوره اولیه",
      intro: "سلام، من دستیار آنلاین لنا هستم. درباره خدمات، مراقبت‌ها و رزرو وقت راهنمایی‌ات می‌کنم.",
      typing: "در حال نوشتن",
      suggested: "پرسش‌های پیشنهادی",
      yourMessage: "پیام شما",
      placeholder: "سؤالت رو اینجا بنویس…",
      send: "ارسال پیام",
      disclaimer: "پاسخ‌ها جایگزین مشاوره تخصصی حضوری نیستند.",
      needHelp: "نیاز به راهنمایی داری؟",
      askLena: "از لنا بپرس",
      fallback: {
        booking: "برای رزرو، بخش «رزرو و مشاوره» همین سایت را تکمیل کن؛ درخواستت برای هماهنگی در واتساپ آماده می‌شود. اگر بخواهی، در انتخاب خدمت مناسب هم راهنمایی‌ات می‌کنم.",
        price: "هزینهٔ دقیق به تکنیک، وضعیت فعلی پوست و فرم موردنظر بستگی دارد. برای پیشنهاد دقیق‌تر، مشاورهٔ کوتاه و بررسی عکس واضح از ناحیه لازم است.",
        care: "مراقبت‌ها به نوع خدمت بستگی دارند؛ معمولاً ناحیه را تمیز و خشک نگه دار، از دست‌کاری و آفتاب مستقیم دوری کن و دستور متخصص را انجام بده. نام خدمتت را بگو تا دقیق‌تر راهنمایی کنم.",
        brows: "برای نتیجهٔ طبیعی ابرو، تکنیک مناسب به جنس پوست، تراکم مو و نتیجهٔ دلخواه بستگی دارد. نانو بروز و هاشور برای خطوط ظریف مناسب‌اند و شیدینگ جلوه‌ای نرم‌تر و پودری ایجاد می‌کند.",
        lips: "شیدینگ لب به یکنواخت‌تر شدن تناژ و تعریف ملایم فرم لب کمک می‌کند. رنگ پس از بررسی رنگ طبیعی لب و سلیقهٔ شما انتخاب می‌شود تا نتیجه با چهره هماهنگ باشد.",
        location: "کلینیک در شیراز، معالی‌آباد، ابتدای بهاران، مجتمع اداری آرین قرار دارد. برای هماهنگی پیش از مراجعه، از بخش رزرو سایت اقدام کن.",
        general: "می‌توانم دربارهٔ انتخاب خدمات ابرو و لب، مراقبت‌های قبل و بعد، نمونه‌کارها و رزرو مشاوره راهنمایی‌ات کنم. دوست داری از کدام مورد شروع کنیم؟"
      },
      patterns: {
        booking: /رزرو|وقت|نوبت|مشاوره/,
        price: /قیمت|هزینه|تعرفه/,
        care: /مراقبت|بعد از|ترمیم|شست/,
        brows: /ابرو|میکرو|نانو|هاشور/,
        lips: /لب|شیدینگ لب|رژ/,
        location: /آدرس|کجا|مکان|شیراز/
      }
    },
    en: {
      prompts: [
        { label: "Choose a service", value: "Can you help me choose the right service?" },
        { label: "Aftercare", value: "How should I care for my skin after a PMU service?" },
        { label: "Book a consultation", value: "How can I book a consultation?" }
      ],
      nudge: "Need help choosing a service?",
      closeNudge: "Close message",
      assistant: "Lena’s virtual assistant",
      clinic: "Clinic virtual assistant",
      brand: "Lena",
      ready: "Ready to help",
      closeChat: "Close chat",
      firstConsultation: "Initial consultation",
      intro: "Hello, I’m Lena’s online assistant. I can help with services, aftercare, and booking a consultation.",
      typing: "Typing",
      suggested: "Suggested questions",
      yourMessage: "Your message",
      placeholder: "Type your question here…",
      send: "Send message",
      disclaimer: "Replies do not replace an in-person consultation with a specialist.",
      needHelp: "Need a little guidance?",
      askLena: "Ask Lena",
      fallback: {
        booking: "To request an appointment, complete the Booking & Consultation form on this website. Your request will be prepared for coordination through WhatsApp. I can also help you choose a suitable service.",
        price: "The exact price depends on the technique, your current skin condition, and the result you want. A brief consultation and a clear photo of the area help us make a more accurate recommendation.",
        care: "Aftercare depends on the service. In general, keep the area clean and dry, avoid touching it and direct sun, and follow your specialist’s instructions. Tell me which service you had for more relevant guidance.",
        brows: "A natural-looking brow technique depends on your skin type, hair density, and desired result. Nano brows and hairstrokes create fine lines, while shading gives a softer, powder-like finish.",
        lips: "Lip shading can help even out the tone and softly define the lip shape. The color should be selected after reviewing your natural lip tone and preferences for a result that suits your features.",
        location: "The clinic is in Maali-Abad, Shiraz, at the beginning of Baharan Street, Arian Office Complex. Please use the booking section to coordinate before visiting.",
        general: "I can help with brow and lip services, before- and aftercare, portfolio examples, and consultation bookings. What would you like to ask about first?"
      },
      patterns: {
        booking: /book|appointment|consult|schedule/,
        price: /price|cost|fee|how much/,
        care: /aftercare|care|healing|wash|after treatment/,
        brows: /brow|eyebrow|microblading|nano|hairstroke/,
        lips: /lip|shading|lipstick/,
        location: /address|where|location|shiraz/
      }
    },
    ar: {
      prompts: [
        { label: "اختيار الخدمة", value: "هل يمكنك مساعدتي في اختيار الخدمة المناسبة؟" },
        { label: "العناية بعد الخدمة", value: "كيف أعتني ببشرتي بعد خدمة التجميل الدائم؟" },
        { label: "حجز استشارة", value: "كيف يمكنني حجز استشارة؟" }
      ],
      nudge: "هل تحتاجين إلى مساعدة في اختيار الخدمة؟",
      closeNudge: "إغلاق الرسالة",
      assistant: "مساعدة لنا الافتراضية",
      clinic: "المساعدة الافتراضية للعيادة",
      brand: "لنا",
      ready: "جاهزة للمساعدة",
      closeChat: "إغلاق المحادثة",
      firstConsultation: "استشارة أولية",
      intro: "مرحباً، أنا المساعدة الإلكترونية للنا. يمكنني إرشادك بشأن الخدمات والعناية بعد الإجراء وحجز الاستشارة.",
      typing: "جارٍ الكتابة",
      suggested: "أسئلة مقترحة",
      yourMessage: "رسالتك",
      placeholder: "اكتبي سؤالك هنا…",
      send: "إرسال الرسالة",
      disclaimer: "لا تغني الإجابات عن استشارة حضورية مع مختصة.",
      needHelp: "هل تحتاجين إلى إرشاد؟",
      askLena: "اسألي لنا",
      fallback: {
        booking: "لطلب موعد، أكملي نموذج الحجز والاستشارة على الموقع. ستُجهّز رسالتك للتنسيق عبر واتساب. ويمكنني أيضاً مساعدتك في اختيار الخدمة المناسبة.",
        price: "تعتمد التكلفة الدقيقة على التقنية وحالة البشرة الحالية والشكل المطلوب. تساعد استشارة قصيرة وصورة واضحة للمنطقة على تقديم توصية أدق.",
        care: "تختلف العناية حسب نوع الخدمة. عموماً، حافظي على نظافة المنطقة وجفافها، وتجنبي لمسها والتعرض المباشر للشمس، واتّبعي تعليمات المختصة. اذكري الخدمة لأقدّم إرشاداً أدق.",
        brows: "يعتمد اختيار تقنية الحواجب الطبيعية على نوع البشرة وكثافة الشعر والنتيجة المرغوبة. تناسب تقنية النانو والشعيرات الخطوط الدقيقة، بينما يمنح التظليل مظهراً أنعم كالبودرة.",
        lips: "يساعد تظليل الشفاه على توحيد اللون وتحديد شكلها بلطف. يُختار اللون بعد تقييم لون الشفاه الطبيعي وتفضيلاتك لتحقيق نتيجة متناغمة مع ملامحك.",
        location: "تقع العيادة في شيراز، معالي آباد، بداية شارع بهاران، مجمع آريان للمكاتب. يُرجى التنسيق قبل الزيارة من قسم الحجز على الموقع.",
        general: "يمكنني إرشادك بشأن خدمات الحواجب والشفاه والعناية قبل الإجراء وبعده وأمثلة الأعمال وحجز الاستشارة. ما الموضوع الذي تودين البدء به؟"
      },
      patterns: {
        booking: /حجز|موعد|استشارة/,
        price: /سعر|تكلفة|أسعار/,
        care: /عناية|بعد|ترميم|غسل/,
        brows: /حاجب|حواجب|ميكروبليدنج|نانو/,
        lips: /شفاه|شفة|تظليل|أحمر الشفاه/,
        location: /عنوان|أين|موقع|شيراز/
      }
    },
    zh: {
      prompts: [
        { label: "选择服务", value: "可以帮我选择适合的服务吗？" },
        { label: "术后护理", value: "做完半永久妆后应该如何护理皮肤？" },
        { label: "预约咨询", value: "怎样预约咨询？" }
      ],
      nudge: "需要帮助选择服务吗？",
      closeNudge: "关闭提示",
      assistant: "Lena 智能助理",
      clinic: "诊所智能助理",
      brand: "Lena",
      ready: "随时为您提供帮助",
      closeChat: "关闭对话",
      firstConsultation: "初步咨询",
      intro: "您好，我是 Lena 的在线助理，可以为您介绍服务、术后护理和咨询预约。",
      typing: "正在输入",
      suggested: "推荐问题",
      yourMessage: "您的消息",
      placeholder: "请在这里输入问题…",
      send: "发送消息",
      disclaimer: "回复不能替代与专业人员的面对面咨询。",
      needHelp: "需要一些建议吗？",
      askLena: "咨询 Lena",
      fallback: {
        booking: "如需预约，请填写本网站的预约与咨询表单。您的请求会整理为 WhatsApp 协调信息。我也可以帮您选择合适的服务。",
        price: "具体费用取决于所选技术、当前皮肤状况和期望效果。简短咨询并查看清晰的局部照片，有助于给出更准确的建议。",
        care: "护理方式因服务而异。通常应保持该区域清洁干燥，避免触碰和阳光直射，并遵循专业人员的具体指导。告诉我您做的项目，我可以提供更相关的建议。",
        brows: "自然眉形的技术选择取决于肤质、眉毛密度和期望效果。纳米眉和仿真线条适合细致的毛流效果，雾眉则呈现更柔和的粉雾感。",
        lips: "唇部雾化可帮助均匀唇色并柔和勾勒唇形。应根据天然唇色和个人偏好选择颜色，使效果与面部特征协调。",
        location: "诊所位于设拉子 Maali-Abad 区，Baharan 街起点的 Arian 办公楼。到访前请通过网站预约区进行协调。",
        general: "我可以为您介绍眉部和唇部服务、术前术后护理、作品案例及咨询预约。您想先了解哪一项？"
      },
      patterns: {
        booking: /预约|预订|咨询|时间/,
        price: /价格|费用|多少钱/,
        care: /护理|恢复|清洗|术后/,
        brows: /眉|纹眉|眉毛|纳米/,
        lips: /唇|嘴唇|雾唇/,
        location: /地址|哪里|位置|设拉子/
      }
    }
  }[locale] || null;
  const localizedCopy = copy || null;

  const state = {
    open: false,
    busy: false,
    history: [],
    greeted: false
  };

  const quickPrompts = (localizedCopy || {
    prompts: [
      { label: "انتخاب خدمات", value: "برای انتخاب خدمت مناسب راهنمایی می‌خواهم." },
      { label: "مراقبت‌های بعد", value: "مراقبت‌های بعد از خدمات آرایش دائم چیست؟" },
      { label: "رزرو مشاوره", value: "چطور می‌توانم وقت مشاوره رزرو کنم؟" }
    ]
  }).prompts;
  const text = (key, fallback) => localizedCopy?.[key] || fallback;

  const widget = document.createElement("div");
  widget.className = "lena-assistant";
  widget.innerHTML = `
    <div class="lena-assistant__nudge" role="status" aria-live="polite">
      <span>${text("nudge", "برای انتخاب خدمات راهنمایی می‌خوای؟")}</span>
      <button type="button" aria-label="${text("closeNudge", "بستن پیام")}">×</button>
    </div>

    <section class="lena-assistant__panel" role="dialog" aria-modal="false"
      aria-label="${text("assistant", "دستیار هوشمند لنا")}" aria-hidden="true">
      <header class="lena-assistant__header">
        <div class="lena-assistant__portrait" aria-hidden="true">
          <video class="lena-assistant__portrait-video" muted playsinline preload="none"
            poster="${asset("robot-assistant-poster.jpg")}">
            <source data-src="${asset("robot-assistant.mp4")}" type="video/mp4">
          </video>
          <span class="lena-assistant__presence"></span>
        </div>
        <div class="lena-assistant__identity">
          <small>${text("clinic", "دستیار هوشمند کلینیک")}</small>
          <strong>${text("brand", "لنا")}</strong>
          <span><i></i> ${text("ready", "آماده راهنمایی")}</span>
        </div>
        <button class="lena-assistant__close" type="button" aria-label="${text("closeChat", "بستن گفتگو")}">
          <span></span><span></span>
        </button>
      </header>

      <div class="lena-assistant__conversation" aria-live="polite">
        <div class="lena-assistant__intro">
          <small>${text("firstConsultation", "مشاوره اولیه")}</small>
          <p>${text("intro", "سلام، من دستیار آنلاین لنا هستم. درباره خدمات، مراقبت‌ها و رزرو وقت راهنمایی‌ات می‌کنم.")}</p>
        </div>
        <div class="lena-assistant__messages"></div>
        <div class="lena-assistant__typing" aria-label="${text("typing", "در حال نوشتن")}">
          <span></span><span></span><span></span>
        </div>
      </div>

      <div class="lena-assistant__quick" aria-label="${text("suggested", "پرسش‌های پیشنهادی")}"></div>

      <form class="lena-assistant__composer">
        <label for="lena-assistant-input">${text("yourMessage", "پیام شما")}</label>
        <textarea id="lena-assistant-input" rows="1"
          placeholder="${text("placeholder", "سؤالت رو اینجا بنویس…")}" maxlength="700"></textarea>
        <button type="submit" aria-label="${text("send", "ارسال پیام")}">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 12h15M13 6l6 6-6 6"/>
          </svg>
        </button>
      </form>
      <p class="lena-assistant__disclaimer">${text("disclaimer", "پاسخ‌ها جایگزین مشاوره تخصصی حضوری نیستند.")}</p>
    </section>

    <button class="lena-assistant__launcher" type="button"
      aria-label="${text("assistant", "گفتگو با دستیار هوشمند لنا")}" aria-expanded="false">
      <span class="lena-assistant__launcher-copy" aria-hidden="true">
        <small>${text("needHelp", "نیاز به راهنمایی داری؟")}</small>
        <b>${text("askLena", "از لنا بپرس")}</b>
      </span>
      <span class="lena-assistant__character" aria-hidden="true">
        <span class="lena-assistant__character-aura"></span>
        <video class="lena-assistant__character-video" muted playsinline preload="none"
          poster="${asset("robot-assistant-poster.jpg")}">
          <source data-src="${asset("robot-assistant.mp4")}" type="video/mp4">
        </video>
        <span class="lena-assistant__character-status"></span>
      </span>
      <span class="lena-assistant__unread">${locale === "fa" ? "۱" : locale === "ar" ? "١" : "1"}</span>
    </button>
  `;

  document.body.appendChild(widget);

  const panel = widget.querySelector(".lena-assistant__panel");
  const launcher = widget.querySelector(".lena-assistant__launcher");
  const closeButton = widget.querySelector(".lena-assistant__close");
  const nudge = widget.querySelector(".lena-assistant__nudge");
  const nudgeClose = nudge.querySelector("button");
  const conversation = widget.querySelector(".lena-assistant__conversation");
  const messages = widget.querySelector(".lena-assistant__messages");
  const typing = widget.querySelector(".lena-assistant__typing");
  const quick = widget.querySelector(".lena-assistant__quick");
  const form = widget.querySelector(".lena-assistant__composer");
  const input = widget.querySelector("textarea");
  const submit = form.querySelector("button");
  const videos = [...widget.querySelectorAll("video")];
  let assistantVideosLoaded = false;
  const character = widget.querySelector(".lena-assistant__character");
  widget.classList.add("has-video-character");
  widget.dir = locale === "ar" || locale === "fa" ? "rtl" : "ltr";
  let interactionX = -.58;
  let interactionY = -.48;
  let desiredX = -.58;
  let desiredY = -.48;
  let desiredTime = 2.42;
  let currentTime = 2.42;
  let lastInteraction = performance.now();
  let nextIdleMove = lastInteraction + 1800;
  let dragPointer = null;
  let dragDistance = 0;
  let dragLastPoint = null;
  let suppressLauncherClick = false;
  let speakingTimer = 0;
  let blinkTimer = 0;
  let lastVideoUpdate = 0;
  let thinkingInterval = 0;
  let speakingGestureInterval = 0;
  let pointerNearCharacter = false;
  let idleArcAngle = 205.5;
  let idleArcTarget = 211.5;
  let idleArcStepAt = performance.now() + 850;
  let idleArcInitialSweep = true;

  const setCharacterMood = (mood) => {
    widget.dataset.characterMood = mood;
  };
  setCharacterMood("idle");

  const setBodyGesture = (lean = 0, lift = 0, scale = 1) => {
    widget.style.setProperty("--lena-lean", `${lean}deg`);
    widget.style.setProperty("--lena-lift", `${lift}px`);
    widget.style.setProperty("--lena-scale", String(scale));
  };

  const poseTime = (x, y) => {
    if (y < -.42) return 3.05;
    if (x < -.28) return 1.78;
    if (x > .28) return 4.55;
    return .45;
  };

  const setArcLook = (angle) => {
    const progress = Math.max(0, Math.min(1, (angle - 180) / 50));
    const arcLift = Math.sin(progress * Math.PI) * .12;
    desiredX = -.72 + (.24 * progress);
    desiredY = .12 - (.98 * progress) - arcLift;
    desiredTime = 1.78 + (1.27 * progress);
    const lean = -1.05 + (.4 * progress);
    setBodyGesture(lean, -Math.sin(progress * Math.PI) * 1.4, 1.003);
    setCharacterMood(progress < .18 ? "observing" : progress > .78 ? "curious" : "attentive");
  };

  const chooseIdleArcTarget = (now) => {
    const roll = Math.random();
    let rangeStart;
    let rangeEnd;

    if (roll < .72) {
      rangeStart = 198;
      rangeEnd = 216;
    } else if (roll < .9) {
      rangeStart = 184.5;
      rangeEnd = 196.5;
    } else {
      rangeStart = 217.5;
      rangeEnd = 225;
    }

    const possibleSteps = Math.floor((rangeEnd - rangeStart) / 1.5);
    let nextTarget = rangeStart + (Math.floor(Math.random() * (possibleSteps + 1)) * 1.5);
    if (Math.abs(nextTarget - idleArcAngle) < 7.5) {
      nextTarget = idleArcAngle < 210
        ? Math.min(rangeEnd, idleArcAngle + 9)
        : Math.max(rangeStart, idleArcAngle - 9);
    }
    idleArcTarget = nextTarget;
    const isPrimaryLeftUp = nextTarget >= 198 && nextTarget <= 216;
    idleArcStepAt = now + (isPrimaryLeftUp ? 1700 : 750) + Math.random() * (isPrimaryLeftUp ? 1800 : 1100);
  };

  const setDesiredLook = (x, y, interactive = true) => {
    desiredX = Math.max(-1, Math.min(1, x));
    desiredY = Math.max(-1, Math.min(1, y));
    desiredTime = poseTime(desiredX, desiredY);
    if (interactive) {
      lastInteraction = performance.now();
      nextIdleMove = lastInteraction + 2400;
    }
  };

  const updateLookFromPoint = (clientX, clientY, interactive = true) => {
    const rect = character.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height * .42;
    const rangeX = Math.max(180, window.innerWidth * .32);
    const rangeY = Math.max(150, window.innerHeight * .3);
    setDesiredLook(
      (clientX - centerX) / rangeX,
      (clientY - centerY) / rangeY,
      interactive
    );
  };

  const setSpeaking = (speaking, duration = 0) => {
    window.clearTimeout(speakingTimer);
    window.clearInterval(speakingGestureInterval);
    widget.classList.toggle("is-speaking", speaking);
    if (speaking) {
      setCharacterMood("speaking");
      let gestureStep = 0;
      speakingGestureInterval = window.setInterval(() => {
        gestureStep += 1;
        const side = gestureStep % 4 === 0 ? .16 : gestureStep % 3 === 0 ? -.12 : 0;
        const nod = gestureStep % 2 ? .08 : -.04;
        setDesiredLook(side, nod, false);
        setBodyGesture(side * 2.2, gestureStep % 2 ? -1.2 : 0, 1.006);
      }, 680);
    } else {
      setCharacterMood(state.busy ? "thinking" : state.open ? "listening" : "idle");
      setBodyGesture();
    }
    if (speaking && duration) {
      speakingTimer = window.setTimeout(() => setSpeaking(false), duration);
    }
  };

  const scheduleBlink = () => {
    window.clearTimeout(blinkTimer);
    if (reducedMotion.matches) return;
    blinkTimer = window.setTimeout(() => {
      widget.classList.add("is-blinking");
      window.setTimeout(() => widget.classList.remove("is-blinking"), 170);
      if (Math.random() < .22) {
        window.setTimeout(() => {
          widget.classList.add("is-blinking");
          window.setTimeout(() => widget.classList.remove("is-blinking"), 145);
        }, 285);
      }
      scheduleBlink();
    }, 2600 + Math.random() * 4600);
  };

  const animateCharacter = (now) => {
    if (!reducedMotion.matches) {
      const canRunIdleArc =
        dragPointer === null &&
        !pointerNearCharacter &&
        !state.busy &&
        !widget.classList.contains("is-speaking") &&
        document.activeElement !== input;

      if (canRunIdleArc && now >= idleArcStepAt) {
        const difference = idleArcTarget - idleArcAngle;
        if (Math.abs(difference) <= 1.5) {
          idleArcAngle = idleArcTarget;
          setArcLook(idleArcAngle);
          if (idleArcInitialSweep) idleArcInitialSweep = false;
          chooseIdleArcTarget(now);
        } else {
          idleArcAngle += Math.sign(difference) * 1.5;
          idleArcAngle = Math.max(180, Math.min(230, idleArcAngle));
          setArcLook(idleArcAngle);
          idleArcStepAt = now + (idleArcInitialSweep ? 175 : 210 + Math.random() * 90);
        }
      }

      interactionX += (desiredX - interactionX) * .075;
      interactionY += (desiredY - interactionY) * .075;
      currentTime += (desiredTime - currentTime) * .085;
      widget.style.setProperty("--lena-look-x", interactionX.toFixed(3));
      widget.style.setProperty("--lena-look-y", interactionY.toFixed(3));
      widget.classList.toggle(
        "is-face-front",
        Math.abs(interactionX) < .24 && Math.abs(interactionY) < .24
      );
      if (now - lastVideoUpdate > 55) {
        lastVideoUpdate = now;
        videos.forEach((video) => {
          if (video.readyState >= 1 && Math.abs(video.currentTime - currentTime) > .055) {
            video.currentTime = currentTime;
          }
        });
      }
    }
    window.requestAnimationFrame(animateCharacter);
  };

  videos.forEach((video) => {
    video.addEventListener("loadedmetadata", () => {
      video.pause();
      video.currentTime = currentTime;
    }, { once: true });
  });
  setArcLook(205.5);
  scheduleBlink();
  window.requestAnimationFrame(animateCharacter);

  quickPrompts.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = item.label;
    button.addEventListener("click", () => sendMessage(item.value));
    quick.appendChild(button);
  });

  const playVideos = () => {
    if (
      reducedMotion.matches ||
      document.documentElement.classList.contains("reduced-motion") ||
      document.body.classList.contains("reduced-motion")
    ) return;
    videos.forEach((video) => {
      video.pause();
      if (video.readyState >= 1) video.currentTime = currentTime;
    });
  };

  const pauseVideos = () => videos.forEach((video) => video.pause());

  const loadAssistantVideos = () => {
    if (assistantVideosLoaded) return;
    assistantVideosLoaded = true;
    videos.forEach((video) => {
      const source = video.querySelector("source[data-src]");
      if (!source) return;
      source.src = source.dataset.src;
      source.removeAttribute("data-src");
      video.load();
    });
  };

  const setOpen = (open) => {
    state.open = open;
    widget.classList.toggle("is-open", open);
    launcher.setAttribute("aria-expanded", String(open));
    panel.setAttribute("aria-hidden", String(!open));
    nudge.classList.remove("is-visible");

    if (open) {
      if (!reducedMotion.matches) loadAssistantVideos();
      if (!state.busy && !widget.classList.contains("is-speaking")) {
        setCharacterMood("attentive");
        setDesiredLook(-.28, -.18, false);
        setBodyGesture(-.35, -1, 1.003);
      }
      playVideos();
      window.setTimeout(() => input.focus(), reducedMotion.matches ? 0 : 280);
    } else {
      setCharacterMood("idle");
      setBodyGesture();
      nextIdleMove = performance.now() + 1000;
      pauseVideos();
      launcher.focus({ preventScroll: true });
    }
  };

  launcher.addEventListener("click", () => {
    if (suppressLauncherClick) {
      suppressLauncherClick = false;
      return;
    }
    setOpen(!state.open);
  });

  document.addEventListener("pointermove", (event) => {
    if (event.pointerType === "mouse" && dragPointer === null) {
      const rect = character.getBoundingClientRect();
      const dx = event.clientX - (rect.left + rect.width / 2);
      const dy = event.clientY - (rect.top + rect.height / 2);
      const influenceRadius = Math.max(270, Math.min(window.innerWidth, window.innerHeight) * .44);
      const isNear = Math.hypot(dx, dy) < influenceRadius;
      if (isNear) {
        pointerNearCharacter = true;
        widget.classList.add("is-tracking");
        setCharacterMood("tracking");
        setBodyGesture(Math.max(-1.2, Math.min(1.2, dx / influenceRadius)), -1, 1.005);
        updateLookFromPoint(event.clientX, event.clientY);
      } else if (pointerNearCharacter) {
        pointerNearCharacter = false;
        widget.classList.remove("is-tracking");
        setCharacterMood(state.open ? "listening" : "idle");
        setBodyGesture();
        nextIdleMove = performance.now() + 900;
      }
    }
  }, { passive: true });

  character.addEventListener("pointerdown", (event) => {
    dragPointer = event.pointerId;
    dragDistance = 0;
    dragLastPoint = { x: event.clientX, y: event.clientY };
    character.setPointerCapture?.(event.pointerId);
    widget.classList.add("is-character-held");
    setCharacterMood("engaged");
    setBodyGesture(0, -2, 1.012);
    updateLookFromPoint(event.clientX, event.clientY);
  });

  character.addEventListener("pointermove", (event) => {
    if (dragPointer !== event.pointerId) return;
    if (dragLastPoint) {
      dragDistance +=
        Math.abs(event.clientX - dragLastPoint.x) +
        Math.abs(event.clientY - dragLastPoint.y);
    }
    dragLastPoint = { x: event.clientX, y: event.clientY };
    updateLookFromPoint(event.clientX, event.clientY);
  });

  const releaseCharacter = (event) => {
    if (dragPointer !== event.pointerId) return;
    suppressLauncherClick = dragDistance > 8;
    dragPointer = null;
    dragLastPoint = null;
    widget.classList.remove("is-character-held");
    setCharacterMood(state.open ? "listening" : "attentive");
    setBodyGesture(0, -1, 1.004);
    nextIdleMove = performance.now() + 1900;
  };

  character.addEventListener("pointerup", releaseCharacter);
  character.addEventListener("pointercancel", releaseCharacter);
  closeButton.addEventListener("click", () => setOpen(false));
  nudge.addEventListener("click", (event) => {
    if (event.target === nudgeClose) {
      nudge.classList.remove("is-visible");
      return;
    }
    setOpen(true);
  });
  nudgeClose.addEventListener("click", (event) => event.stopPropagation());

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state.open) setOpen(false);
  });

  input.addEventListener("input", () => {
    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight, 112)}px`;
    if (!state.busy && !widget.classList.contains("is-speaking")) {
      setCharacterMood("listening");
      setDesiredLook(-.42 + Math.random() * .14, -.28 + Math.random() * .08, false);
      setBodyGesture(-.55, -1, 1.004);
    }
  });

  input.addEventListener("focus", () => {
    if (state.busy || widget.classList.contains("is-speaking")) return;
    setCharacterMood("listening");
    setDesiredLook(-.42, -.24, false);
    setBodyGesture(-.5, -1, 1.004);
  });

  input.addEventListener("blur", () => {
    if (state.busy || widget.classList.contains("is-speaking")) return;
    setCharacterMood(state.open ? "attentive" : "idle");
    setBodyGesture();
    nextIdleMove = performance.now() + 1100;
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      form.requestSubmit();
    }
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const message = input.value.trim();
    if (message) sendMessage(message);
  });

  function appendMessage(role, text) {
    const item = document.createElement("div");
    item.className = `lena-assistant__message is-${role}`;
    const bubble = document.createElement("p");
    bubble.textContent = text;
    item.appendChild(bubble);
    messages.appendChild(item);
    if (role === "assistant") {
      setDesiredLook(0, -.08, false);
      setSpeaking(true, Math.max(1400, Math.min(5200, text.length * 38)));
    }
    conversation.scrollTo({
      top: conversation.scrollHeight,
      behavior: reducedMotion.matches ? "auto" : "smooth"
    });
  }

  function setBusy(busy) {
    state.busy = busy;
    widget.classList.toggle("is-busy", busy);
    input.disabled = busy;
    submit.disabled = busy;
    quick.querySelectorAll("button").forEach((button) => {
      button.disabled = busy;
    });
    if (busy) {
      widget.classList.add("is-thinking");
      setCharacterMood("thinking");
      setDesiredLook(-.34, -.2, false);
      setBodyGesture(-.6, -1, 1.003);
      let thoughtStep = 0;
      window.clearInterval(thinkingInterval);
      thinkingInterval = window.setInterval(() => {
        thoughtStep += 1;
        const thoughtLooks = [
          [-.46, -.22, -.7],
          [.08, -.7, 0],
          [.34, -.12, .55],
          [-.1, -.05, -.15]
        ];
        const [x, y, lean] = thoughtLooks[thoughtStep % thoughtLooks.length];
        setDesiredLook(x, y, false);
        setBodyGesture(lean, thoughtStep % 2 ? -1 : 0, 1.003);
      }, 1150);
      typing.classList.add("is-visible");
      conversation.scrollTop = conversation.scrollHeight;
    } else {
      window.clearInterval(thinkingInterval);
      widget.classList.remove("is-thinking");
      if (!widget.classList.contains("is-speaking")) {
        setCharacterMood(state.open ? "listening" : "idle");
        setBodyGesture();
      }
      typing.classList.remove("is-visible");
    }
  }

  async function sendMessage(message) {
    if (state.busy) return;
    if (!state.open) setOpen(true);

    appendMessage("user", message);
    state.history.push({ role: "user", content: message });
    input.value = "";
    input.style.height = "auto";
    setBusy(true);

    try {
      const response = config.mode === "api" && config.endpoint
        ? await requestApi(message)
        : await demoReply(message);

      appendMessage("assistant", response);
      state.history.push({ role: "assistant", content: response });
    } catch (error) {
      appendMessage(
        "assistant",
        "الان ارتباط برقرار نشد. می‌تونی دوباره تلاش کنی یا برای هماهنگی مستقیم از واتساپ استفاده کنی."
      );
      console.error("Lena assistant:", error);
    } finally {
      setBusy(false);
      input.focus();
    }
  }

  async function requestApi(message) {
    const controller = new AbortController();
    const timeout = window.setTimeout(
      () => controller.abort(),
      Number(config.timeout) || 30000
    );

    const body = typeof config.buildRequest === "function"
      ? config.buildRequest({
          message,
          history: state.history.slice(-12),
          page: {
            title: document.title,
            url: window.location.href
          }
        })
      : { message, history: state.history.slice(-12) };

    try {
      const response = await fetch(config.endpoint, {
        method: config.method || "POST",
        headers: config.headers || { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal
      });
      if (!response.ok) throw new Error(`API ${response.status}`);
      const payload = await response.json();
      const text = typeof config.readResponse === "function"
        ? config.readResponse(payload)
        : payload.reply;
      if (!text) throw new Error("Empty assistant response");
      return text;
    } finally {
      window.clearTimeout(timeout);
    }
  }

  async function demoReply(message) {
    await new Promise((resolve) => {
      window.setTimeout(resolve, reducedMotion.matches ? 120 : 650);
    });

    if (localizedCopy) {
      const normalizedMessage = message.toLowerCase();
      const { patterns, fallback } = localizedCopy;
      if (patterns.booking.test(normalizedMessage)) return fallback.booking;
      if (patterns.price.test(normalizedMessage)) return fallback.price;
      if (patterns.care.test(normalizedMessage)) return fallback.care;
      if (patterns.brows.test(normalizedMessage)) return fallback.brows;
      if (patterns.lips.test(normalizedMessage)) return fallback.lips;
      if (patterns.location.test(normalizedMessage)) return fallback.location;
      return fallback.general;
    }

    const normalized = message.replace(/\u200c/g, " ").toLowerCase();

    if (/رزرو|وقت|نوبت|مشاوره/.test(normalized)) {
      return "برای رزرو، بخش «رزرو و مشاوره» همین سایت را تکمیل کن؛ درخواستت مستقیم برای هماهنگی در واتساپ ارسال می‌شود. اگر بخواهی، می‌توانم کمکت کنم خدمت مناسب را هم انتخاب کنی.";
    }

    if (/قیمت|هزینه|تعرفه/.test(normalized)) {
      return "هزینه دقیق به تکنیک، وضعیت فعلی پوست و فرم موردنظر بستگی دارد. بهترین کار یک مشاوره کوتاه و دیدن عکس واضح از ناحیه است تا پیشنهاد دقیق‌تری دریافت کنی.";
    }

    if (/مراقبت|بعد از|ترمیم|شست/.test(normalized)) {
      return "مراقبت‌ها با توجه به نوع خدمت متفاوت‌اند؛ معمولاً باید ناحیه را تمیز و خشک نگه داری، از دست‌کاری و آفتاب مستقیم دوری کنی و دستور اختصاصی متخصص را دقیق انجام بدهی. نام خدمتت را بگو تا راهنمایی مرتبط‌تری بدهم.";
    }

    if (/ابرو|میکرو|نانو|هاشور/.test(normalized)) {
      return "برای نتیجه طبیعی ابرو، انتخاب تکنیک به جنس پوست، تراکم مو و نتیجه دلخواه بستگی دارد. نانو بروز و هاشور برای خطوط ظریف مناسب‌اند و شیدینگ جلوه نرم‌تر و پودری ایجاد می‌کند.";
    }

    if (/لب|شیدینگ لب|رژ/.test(normalized)) {
      return "شیدینگ لب برای یکنواخت‌تر شدن تناژ و تعریف ملایم فرم لب انجام می‌شود. انتخاب رنگ پس از بررسی رنگ طبیعی لب و سلیقه شماست؛ نتیجه نهایی باید طبیعی و هماهنگ با چهره باشد.";
    }

    if (/آدرس|کجا|مکان|شیراز/.test(normalized)) {
      return "کلینیک در شیراز، معالی‌آباد، ابتدای بهاران، مجتمع اداری آرین قرار دارد. برای هماهنگی قبل از مراجعه می‌توانی از بخش رزرو سایت اقدام کنی.";
    }

    return "می‌تونم درباره انتخاب خدمات ابرو و لب، مراقبت‌های قبل و بعد، نمونه‌کارها و رزرو مشاوره راهنمایی‌ات کنم. دوست داری از کدام مورد شروع کنیم؟";
  }

  window.setTimeout(() => {
    if (!state.open && !state.greeted) {
      state.greeted = true;
      nudge.classList.add("is-visible");
      playVideos();
    }
  }, reducedMotion.matches ? 0 : 3200);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pauseVideos();
    else if (state.open || nudge.classList.contains("is-visible")) playVideos();
  });

  // Visual QA helper: append ?assistant=open to preview the open state.
  const assistantPreview = new URLSearchParams(window.location.search);
  if (assistantPreview.get("assistant") === "open") {
    setOpen(true);
  }
  if (assistantPreview.get("assistant") === "speak") {
    setOpen(true);
    setSpeaking(true);
  }
  const previewLook = assistantPreview.get("look");
  if (previewLook === "left") setDesiredLook(-1, 0, false);
  if (previewLook === "right") setDesiredLook(1, 0, false);
  if (previewLook === "up") setDesiredLook(0, -1, false);
})();
