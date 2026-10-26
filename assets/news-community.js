(() => {
  const cmsNewsScript = document.createElement("script");
  cmsNewsScript.src = "/assets/news-cms-content.js";
  cmsNewsScript.defer = true;
  document.head.append(cmsNewsScript);
  const detectedLocale = (document.documentElement.lang || "fa").split("-")[0].toLowerCase();
  const locale = detectedLocale === "zh-hans" ? "zh" : detectedLocale;
  const copy = {
    fa: {
      title: "گفت‌وگوی زیبایی", intro: "نظرت دربارهٔ این گزارش را با ما در میان بگذار.", resonated: "به دلم نشست", notForMe: "این سبک من نیست", comments: "دیدگاه‌ها", signIn: "برای واکنش و نوشتن دیدگاه، وارد حساب کاربری‌ات شو.", signInTitle: "همراه گفت‌وگو شو", continue: "رفتن به ورود", later: "فعلاً نه", signInComment: "برای نوشتن دیدگاه وارد حساب شو", label: "دیدگاه شما", placeholder: "محترمانه و مرتبط با موضوع بنویس…", consent: "می‌دانم متن دیدگاهم به‌صورت عمومی نمایش داده می‌شود؛ نام و شماره‌ام نمایش داده نمی‌شود.", submit: "ثبت دیدگاه", empty: "هنوز دیدگاهی ثبت نشده؛ تو اولین نفر باش.", posted: "دیدگاهت ثبت شد.", reactionSaved: "واکنشت ثبت شد.", reactionRemoved: "واکنش برداشته شد.", loadError: "گرفتن دیدگاه‌ها ممکن نشد. صفحه را تازه‌سازی کن.", genericError: "انجام درخواست ممکن نشد؛ دوباره تلاش کن.", rateError: "تعداد درخواست‌ها زیاد است؛ کمی بعد دوباره تلاش کن.", member: "خوانندهٔ خبر", tutorialTitle: "راهنمای کوتاه امکانات حساب", tutorialIntro: "حالا که وارد شدی، این سه امکان را بشناس.", steps: [{ title: "واکنش به خبر", body: "با «به دلم نشست» یا «این سبک من نیست» سلیقه‌ات را ثبت کن؛ هر زمان خواستی می‌توانی آن را عوض کنی." }, { title: "گفت‌وگوی محترمانه", body: "دیدگاهت را پایین خبر بنویس. متن دیدگاه عمومی است، اما نام و شمارهٔ حساب نمایش داده نمی‌شود." }, { title: "پنل کاربران", body: "در پنل می‌توانی نام و تصویر پروفایل را ویرایش کنی و وضعیت درخواست‌هایت را ببینی." }], previous: "قبلی", next: "بعدی", skip: "رد کردن راهنما", done: "شروع کنیم", openAccount: "رفتن به پنل کاربران", dateLocale: "fa-IR-u-ca-persian", commentsCount: "دیدگاه" },
    en: {
      title: "Beauty Journal Conversation", intro: "Share what you think about this story.", resonated: "This speaks to me", notForMe: "Not my style", comments: "Comments", signIn: "Sign in to react or leave a comment.", signInTitle: "Join the conversation", continue: "Sign in", later: "Not now", signInComment: "Sign in to write a comment", label: "Your comment", placeholder: "Keep it kind and on topic…", consent: "I understand my comment will be public; my name and phone number will not be shown.", submit: "Post comment", empty: "No comments yet. Be the first to share your thoughts.", posted: "Your comment was posted.", reactionSaved: "Your response was saved.", reactionRemoved: "Your response was removed.", loadError: "Could not load comments. Refresh the page to try again.", genericError: "Something went wrong. Please try again.", rateError: "Too many requests. Please try again later.", member: "Journal reader", tutorialTitle: "A quick guide to your account", tutorialIntro: "Now that you’re signed in, here are three useful features.", steps: [{ title: "React to a story", body: "Use “This speaks to me” or “Not my style” to share your view. You can change your response any time." }, { title: "Join the discussion", body: "Add a respectful comment below the story. Your comment is public; your account name and phone number are not shown." }, { title: "Your account panel", body: "Update your name and profile photo, and check the status of your requests from your account panel." }], previous: "Previous", next: "Next", skip: "Skip guide", done: "Get started", openAccount: "Open account panel", dateLocale: "en-US", commentsCount: "comments" },
    ar: {
      title: "حوار مجلة الجمال", intro: "شاركي رأيك في هذا التقرير.", resonated: "أعجبني هذا الأسلوب", notForMe: "ليس أسلوبي", comments: "التعليقات", signIn: "سجّلي الدخول للتفاعل أو كتابة تعليق.", signInTitle: "انضمي إلى الحوار", continue: "تسجيل الدخول", later: "ليس الآن", signInComment: "سجّلي الدخول لكتابة تعليق", label: "تعليقك", placeholder: "اكتبي باحترام وبما يرتبط بالموضوع…", consent: "أوافق على عرض تعليقي علناً؛ لن يظهر اسمي أو رقم هاتفي.", submit: "نشر التعليق", empty: "لا توجد تعليقات بعد. كوني أول من يشارك رأيه.", posted: "تم نشر تعليقك.", reactionSaved: "تم حفظ تفاعلك.", reactionRemoved: "تم إلغاء تفاعلك.", loadError: "تعذّر تحميل التعليقات. حدّثي الصفحة وحاولي مجدداً.", genericError: "تعذّر إكمال الطلب. حاولي مرة أخرى.", rateError: "طلبات كثيرة. حاولي مرة أخرى بعد قليل.", member: "قارئة المجلة", tutorialTitle: "دليل سريع إلى حسابك", tutorialIntro: "بعد تسجيل الدخول، تعرّفي على هذه الميزات الثلاث.", steps: [{ title: "التفاعل مع الخبر", body: "اختاري «أعجبني هذا الأسلوب» أو «ليس أسلوبي» للتعبير عن رأيك، ويمكنك تغييره في أي وقت." }, { title: "حوار باحترام", body: "اكتبي تعليقاً مناسباً أسفل الخبر. سيظهر التعليق علناً، من دون اسمك أو رقم هاتفك." }, { title: "لوحة حسابك", body: "حدّثي اسمك وصورة ملفك الشخصي، وتابعي حالة طلباتك من لوحة الحساب." }], previous: "السابق", next: "التالي", skip: "تخطي الدليل", done: "لنبدأ", openAccount: "فتح لوحة الحساب", dateLocale: "ar", commentsCount: "تعليق" },
    zh: {
      title: "美妆杂志交流区", intro: "欢迎分享你对这篇报道的看法。", resonated: "我喜欢这个灵感", notForMe: "这不是我的风格", comments: "读者评论", signIn: "登录后即可互动或发表评论。", signInTitle: "加入交流", continue: "前往登录", later: "暂不登录", signInComment: "登录后即可发表评论", label: "你的评论", placeholder: "请友善、围绕主题留言…", consent: "我了解评论会公开显示；我的姓名和手机号不会公开。", submit: "发表评论", empty: "还没有评论，来分享第一条吧。", posted: "评论已发布。", reactionSaved: "已记录你的反馈。", reactionRemoved: "已取消你的反馈。", loadError: "暂时无法加载评论，请刷新页面重试。", genericError: "操作未完成，请重试。", rateError: "操作过于频繁，请稍后重试。", member: "杂志读者", tutorialTitle: "账户功能快速指南", tutorialIntro: "登录成功！下面介绍三个实用功能。", steps: [{ title: "回应文章", body: "选择“我喜欢这个灵感”或“这不是我的风格”表达看法，之后也可以随时更改。" }, { title: "友善交流", body: "在文章下方发表评论。评论会公开显示，但账户姓名和手机号不会展示。" }, { title: "用户中心", body: "在账户页面更新姓名和头像，并查看预约申请的处理状态。" }], previous: "上一步", next: "下一步", skip: "跳过指南", done: "开始使用", openAccount: "打开用户中心", dateLocale: "zh-CN", commentsCount: "条评论" }
  };
  const text = copy[locale] || copy.fa;
  const host = document.querySelector("[data-news-community]");
  if (!host) return;
  const article = host.dataset.articleSlug;
  const communityUrl = `/api/news/${encodeURIComponent(article)}/community`;
  const reactionUrl = `/api/customer/news/${encodeURIComponent(article)}/reaction`;
  const commentsUrl = `/api/customer/news/${encodeURIComponent(article)}/comments`;
  const state = { signedIn: false, reaction: null, counts: { resonated: 0, "not-for-me": 0 }, comments: [] };
  const node = (tag, className, content) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (content !== undefined) element.textContent = content;
    return element;
  };
  const button = (label, className, type = "button") => {
    const element = node("button", className, label);
    element.type = type;
    return element;
  };
  const number = (value) => new Intl.NumberFormat(text.dateLocale).format(value);
  const api = async (url, options = {}) => {
    const response = await fetch(url, { ...options, credentials: "same-origin", headers: { ...(options.body ? { "Content-Type": "application/json" } : {}), ...(options.headers || {}) } });
    if (!response.ok) throw Object.assign(new Error(response.status === 429 ? text.rateError : text.genericError), { status: response.status });
    return response.json();
  };
  const status = node("p", "community-status");
  status.setAttribute("role", "status");
  const heading = node("h2", "community-title", text.title);
  const intro = node("p", "community-intro", text.intro);
  const reactions = node("div", "community-reactions");
  reactions.setAttribute("aria-label", text.title);
  const reactionButtons = {};
  for (const [key, label, icon] of [["resonated", text.resonated, "✦"], ["not-for-me", text.notForMe, "◇"]]) {
    const control = button("", "community-reaction");
    control.dataset.reaction = key;
    control.setAttribute("aria-pressed", "false");
    const symbol = node("span", "community-reaction-icon", icon);
    symbol.setAttribute("aria-hidden", "true");
    const caption = node("span", "community-reaction-label", label);
    const count = node("span", "community-reaction-count", "0");
    control.append(symbol, caption, count);
    reactions.append(control);
    reactionButtons[key] = { control, count };
  }
  const commentsHeading = node("h3", "community-comments-title", text.comments);
  const commentList = node("ol", "community-comment-list");
  const emptyComments = node("p", "community-empty", text.empty);
  const commentSection = node("div", "community-comments");
  const commentControls = node("div", "community-comment-controls");
  const signInComment = button(text.signInComment, "community-signin-comment");
  commentControls.append(signInComment);
  const commentForm = node("form", "community-comment-form");
  const commentLabel = node("label", "community-comment-label", text.label);
  const commentInput = node("textarea", "community-comment-input");
  commentInput.maxLength = 1000;
  commentInput.required = true;
  commentInput.rows = 4;
  commentInput.placeholder = text.placeholder;
  commentInput.setAttribute("aria-label", text.label);
  const consentLabel = node("label", "community-consent");
  const consentInput = node("input");
  consentInput.type = "checkbox";
  consentInput.required = true;
  consentLabel.append(consentInput, node("span", "", text.consent));
  const submitComment = button(text.submit, "community-submit", "submit");
  commentForm.append(commentLabel, commentInput, consentLabel, submitComment);
  commentSection.append(commentsHeading, commentControls, commentForm, emptyComments, commentList);
  host.replaceChildren(heading, intro, reactions, status, commentSection);

  const accountUrl = () => {
    const language = window.location.pathname.match(/^\/(en|ar|zh)\//)?.[1];
    const destination = new URL(`/${language ? `${language}/` : ""}account.html`, window.location.origin);
    destination.searchParams.set("returnTo", window.location.href);
    return destination.href;
  };
  const makeDialog = (kind) => {
    const dialog = node("dialog", `community-dialog community-${kind}-dialog`);
    dialog.setAttribute("aria-labelledby", `${kind}-dialog-title`);
    const title = node("h2", "community-dialog-title", kind === "login" ? text.signInTitle : text.tutorialTitle);
    title.id = `${kind}-dialog-title`;
    const description = node("p", "community-dialog-copy", kind === "login" ? text.signIn : text.tutorialIntro);
    const actions = node("div", "community-dialog-actions");
    dialog.append(title, description, actions);
    document.body.append(dialog);
    return { dialog, title, description, actions };
  };
  const loginDialog = makeDialog("login");
  const showDialog = (dialog) => {
    if (!dialog.open) dialog.showModal();
  };
  const closeDialog = (dialog) => { if (dialog.open) dialog.close(); };
  const openLoginPrompt = () => {
    loginDialog.actions.replaceChildren();
    const confirm = node("a", "community-dialog-primary", text.continue);
    confirm.href = accountUrl();
    const cancel = button(text.later, "community-dialog-secondary");
    cancel.addEventListener("click", () => closeDialog(loginDialog.dialog));
    loginDialog.actions.append(confirm, cancel);
    showDialog(loginDialog.dialog);
  };
  const tutorial = makeDialog("tutorial");
  const renderTutorialStep = (index) => {
    const step = text.steps[index];
    tutorial.description.textContent = text.tutorialIntro;
    const body = tutorial.dialog.querySelector(".community-tutorial-step") || node("p", "community-tutorial-step");
    body.replaceChildren(node("strong", "", `${number(index + 1)}. ${step.title}`), document.createElement("br"), document.createTextNode(step.body));
    if (!body.isConnected) tutorial.dialog.insertBefore(body, tutorial.actions);
    tutorial.actions.replaceChildren();
    if (index > 0) {
      const previous = button(text.previous, "community-dialog-secondary");
      previous.addEventListener("click", () => renderTutorialStep(index - 1));
      tutorial.actions.append(previous);
    }
    const skip = button(index === text.steps.length - 1 ? text.done : text.skip, "community-dialog-secondary");
    skip.addEventListener("click", () => closeDialog(tutorial.dialog));
    tutorial.actions.append(skip);
    if (index < text.steps.length - 1) {
      const next = button(text.next, "community-dialog-primary");
      next.addEventListener("click", () => renderTutorialStep(index + 1));
      tutorial.actions.append(next);
    } else {
      const accountLink = node("a", "community-dialog-primary", text.openAccount);
      const language = window.location.pathname.match(/^\/(en|ar|zh)\//)?.[1];
      accountLink.href = `/${language ? `${language}/` : ""}account.html`;
      tutorial.actions.append(accountLink);
    }
  };
  signInComment.addEventListener("click", openLoginPrompt);

  const renderComments = () => {
    commentList.replaceChildren();
    emptyComments.hidden = state.comments.length > 0;
    for (const comment of state.comments) {
      const item = node("li", "community-comment");
      const meta = node("div", "community-comment-meta");
      meta.append(node("strong", "", text.member));
      if (Number.isFinite(Number(comment.created_at))) {
        const time = node("time", "", new Intl.DateTimeFormat(text.dateLocale, { dateStyle: "medium" }).format(new Date(Number(comment.created_at) * 1000)));
        time.dateTime = new Date(Number(comment.created_at) * 1000).toISOString();
        meta.append(time);
      }
      item.append(meta, node("p", "community-comment-body", comment.body));
      commentList.append(item);
    }
  };
  const renderReactions = () => {
    for (const [key, parts] of Object.entries(reactionButtons)) {
      parts.count.textContent = number(state.counts[key] || 0);
      parts.control.setAttribute("aria-pressed", String(state.reaction === key));
      parts.control.classList.toggle("is-selected", state.reaction === key);
    }
  };
  const refreshCommunity = async () => {
    const result = await api(communityUrl);
    state.counts = result.counts || state.counts;
    state.comments = result.comments || [];
    renderReactions();
    renderComments();
  };
  const init = async () => {
    try {
      await refreshCommunity();
      try {
        const own = await api(reactionUrl);
        state.signedIn = true;
        state.reaction = own.reaction;
      } catch (error) {
        if (error.status !== 401) throw error;
      }
      commentForm.hidden = !state.signedIn;
      commentControls.hidden = state.signedIn;
      renderReactions();
      try {
        if (sessionStorage.getItem("lena-news-tutorial-pending") === "1") {
          sessionStorage.removeItem("lena-news-tutorial-pending");
          renderTutorialStep(0);
          showDialog(tutorial.dialog);
        }
      } catch {}
    } catch {
      status.textContent = text.loadError;
      status.dataset.kind = "error";
      reactions.hidden = true;
      commentForm.hidden = true;
      commentControls.hidden = true;
    }
  };

  for (const [key, parts] of Object.entries(reactionButtons)) {
    parts.control.addEventListener("click", async () => {
      if (!state.signedIn) return openLoginPrompt();
      parts.control.disabled = true;
      try {
        if (state.reaction === key) {
          await api(reactionUrl, { method: "DELETE" });
          state.reaction = null;
          status.textContent = text.reactionRemoved;
        } else {
          await api(reactionUrl, { method: "PUT", body: JSON.stringify({ reaction: key }) });
          state.reaction = key;
          status.textContent = text.reactionSaved;
        }
        await refreshCommunity();
      } catch (error) {
        status.textContent = error.message || text.genericError;
        status.dataset.kind = "error";
      } finally {
        parts.control.disabled = false;
      }
    });
  }

  commentForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!state.signedIn) return openLoginPrompt();
    submitComment.disabled = true;
    try {
      await api(commentsUrl, { method: "POST", body: JSON.stringify({ body: commentInput.value, consent: consentInput.checked }) });
      commentForm.reset();
      await refreshCommunity();
      status.textContent = text.posted;
      status.dataset.kind = "success";
    } catch (error) {
      status.textContent = error.message || text.genericError;
      status.dataset.kind = "error";
    } finally {
      submitComment.disabled = false;
    }
  });
  void init();
})();
