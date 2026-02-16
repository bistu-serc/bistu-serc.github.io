(function () {
  var API_HOSTS = {
    "127.0.0.1:5000": true,
    "localhost:5000": true
  };

  var dataCache = {};
  var introOriginalHtml = null;
  var cultureImageObserver = null;
  var revealObserver = null;
  var parallaxRafPending = false;
  var parallaxListenersBound = false;
  var mobileNavGlobalHandlersBound = false;
  var mobileNavResizeTicking = false;
  var enhancementQueuePending = false;
  var enhancementScheduledRoot = null;
  var resizeDebounceTimer = null;
  var DEFAULT_LANG = "zh";
  var LANG_STORAGE_KEY = "serc-site-lang";
  var SUPPORTED_LANGS = {
    zh: true,
    en: true
  };
  var HOME_INTRO_SUMMARY_ZH =
    "北京信息科技大学软件工程研究中心源于1979年设立的“软件工程研究与开发中心”，长期承担国家重点科研与工程任务，见证并推动了我国软件工程技术与相关标准的发展。中心面向“软件分析与测试、智能软件工程、可信人工智能”三大方向，形成了从理论方法、关键算法到系统平台与工具落地的完整能力链，在模糊测试、符号执行、自动化测试、漏洞检测与安全评估等方面具备扎实工程实力。依托导师与学生协同团队，中心持续产出高水平论文、专利与软著，主持多类纵向与横向项目，并建设可服务教学科研与产业应用的软件工具体系，体现了“科研创新+工程实现+成果转化”一体化特色。";
  var HOME_INTRO_SUMMARY_EN =
    "The Software Engineering Research Center at Beijing Information Science and Technology University traces back to 1979 and has long undertaken national-level research and engineering projects. The center focuses on software analysis and testing, intelligent software engineering, and trustworthy AI, with end-to-end capability from theory and algorithms to platforms and practical tools. It has delivered strong engineering outcomes in fuzzing, symbolic execution, automated testing, vulnerability detection, and security assessment. Through close collaboration between faculty and students, the center continuously produces high-impact papers, patents, and software copyrights, leads government and industry projects, and builds toolchains serving research, education, and real-world applications.";
  var ABOUT_PARAGRAPHS_EN = [
    "The Software Engineering Research and Development Center, established in 1979, is the predecessor of the current center. With support from UNDP and recognition as a key research institution in 1983, it contributed to software engineering standards, theory, methods, environments, Chinese information processing, and multimedia applications.",
    "Across multiple national key programs, the center led major projects on software engineering support environments, tools, standardization, and reverse engineering. A number of important national software engineering standards originated here, and the center has received multiple recognitions for its impact on both research and engineering practice.",
    "After the university merger in 2002, the center became part of Beijing Information Science and Technology University and was renamed the Software Engineering Research Center in 2013, continuing to integrate scientific research, engineering implementation, and technology transfer."
  ];
  var UI_TEXT = {
    zh: {
      htmlLang: "zh-CN",
      ogLocale: "zh_CN",
      siteTitle: "北京信息科技大学-计算机学院-软件工程研究中心",
      siteDescription: "北京信息科技大学计算机学院软件工程研究中心官网，展示中心简介、教师队伍、学生信息、学术成果、中心动态与工具资源。",
      brandAlt: "北京信息科技大学校徽",
      brandTitle: "北京信息科技大学软件工程研究中心",
      nav: {
        home: "首页",
        news: "动态",
        achievement: "学术",
        team: "团队",
        culture: "文化",
        tool: "软件",
        about: "关于"
      },
      route: {
        newsList: "动态",
        newsDetail: "动态详情",
        team: "团队",
        achievement: "学术",
        tool: "软件",
        culture: "文化",
        about: "关于",
        mentor: "导师",
        phd: "博士生",
        master: "硕士生",
        teacherInfo: "导师信息",
        studentInfo: "学生信息"
      },
      home: {
        news: "科研动态",
        team: "导师团队",
        project: "科研项目",
        summary: HOME_INTRO_SUMMARY_ZH
      },
      footer: {
        brandPrefix: "©2026 ",
        labels: {
          address: "地址",
          postcode: "邮政编码",
          email: "负责人邮箱",
          homepage: "负责人主页"
        },
        values: {
          address: "北京市海淀区清河小营东路12号",
          postcode: "100192",
          email: "czq@bistu.edu.cn",
          homepage: "https://zqcui.github.io/"
        }
      }
    },
    en: {
      htmlLang: "en",
      ogLocale: "en_US",
      siteTitle: "Software Engineering Research Center, BISTU",
      siteDescription: "Official website of the Software Engineering Research Center at BISTU, featuring research, team, publications, news, and software tools.",
      brandAlt: "BISTU Logo",
      brandTitle: "BISTU SERC",
      nav: {
        home: "Home",
        news: "News",
        achievement: "Research",
        team: "People",
        culture: "Culture",
        tool: "Software",
        about: "About"
      },
      route: {
        newsList: "News",
        newsDetail: "News Detail",
        team: "People",
        achievement: "Research",
        tool: "Software",
        culture: "Culture",
        about: "About",
        mentor: "Faculty",
        phd: "PhD Students",
        master: "Master Students",
        teacherInfo: "Faculty Profile",
        studentInfo: "Student Profile"
      },
      home: {
        news: "Research News",
        team: "People",
        project: "Projects",
        summary: HOME_INTRO_SUMMARY_EN
      },
      footer: {
        brandPrefix: "©2026 ",
        labels: {
          address: "Address",
          postcode: "Postal Code",
          email: "PI Email",
          homepage: "PI Homepage"
        },
        values: {
          address: "No. 12 Xiaoying East Road, Qinghe, Haidian District, Beijing, China",
          postcode: "100192",
          email: "czq@bistu.edu.cn",
          homepage: "https://zqcui.github.io/"
        }
      }
    }
  };
  var currentLang = resolveInitialLanguage();
  var STATIC_TEXT_PAIRS = [
    ["动态详情", "News Detail"],
    ["导师信息", "Faculty Profile"],
    ["学生信息", "Student Profile"],
    ["研究方向", "Research Areas"],
    ["提升软件质量，让软件更加可靠、可信", "Quality-driven research for reliable and trustworthy software."],
    ["软件分析及测试技术", "Software Analysis and Testing"],
    ["智能软件工程", "Intelligent Software Engineering"],
    ["可信人工智能", "Trustworthy Artificial Intelligence"],
    ["模糊测试", "Fuzz Testing"],
    ["符号执行", "Symbolic Execution"],
    ["UI测试", "UI Testing"],
    ["测试自动化", "Test Automation"],
    ["覆盖传统软件、嵌入式系统、移动App等", "Covering traditional software, embedded systems, and mobile apps."],
    ["缺陷预测", "Defect Prediction"],
    ["漏洞挖掘", "Vulnerability Mining"],
    ["编程规则挖掘", "Programming Rule Mining"],
    ["注释自动生成", "Automated Comment Generation"],
    ["覆盖智能合约等特定软件应用", "Covering software domains such as smart contracts."],
    ["深度神经网络+", "Deep Neural Networks +"],
    ["缺陷定位", "Fault Localization"],
    ["缺陷修复", "Program Repair"],
    ["覆盖自动驾驶软件、机器翻译等智能软件应用", "Covering intelligent software such as autonomous driving and machine translation."],
    ["主持项目", "Projects"],
    ["国家自然科学基金青年项目", "NSFC Young Scientists Fund"],
    ["江苏省前沿引领技术基础研究专项", "Jiangsu Frontier Leading Technology Basic Research Program"],
    ["北京市教委科技计划项目", "Beijing Municipal Education Commission Science & Technology Program"],
    ["软件新技术国家重点实验室（南京大学）开放课题", "Open Fund, State Key Lab for Novel Software Technology (Nanjing University)"],
    ["北京信息科技大学“勤信人才”培育计划项目", "BISTU Qinxin Talent Program"],
    ["奇虎360公司", "Qihoo 360 Co., Ltd."],
    ["高可信嵌入式软件工程技术实验室开放课题", "Open Fund, High-Confidence Embedded Software Engineering Lab"],
    ["国家网信办数据与技术保障中心，互联网技术与应用分析研究", "CAC Data and Technology Support Center: Internet Technology and Application Analysis"],
    ["横向项目", "Industry Project"],
    ["主持、结题", "PI, Completed"],
    ["主持，结题", "PI, Completed"],
    ["主持子课题、在研", "Sub-project PI, Ongoing"],
    ["发表论文", "Publications"],
    ["提交专利", "Patent Applications"],
    ["申请软著", "Software Copyright Applications"],
    ["出版刊物", "Books"],
    ["作者", "Authors"],
    ["专利名称", "Patent Title"],
    ["申请号", "Application No."],
    ["状态", "Status"],
    ["描述", "Description"],
    ["类型", "Type"],
    ["年份", "Year"],
    ["论文类型", "Paper Type"],
    ["SCI分区", "SCI Quartile"],
    ["标题", "Title"],
    ["CCF分类", "CCF Rank"],
    ["检索类型", "Indexing"],
    ["论文状态", "Status"],
    ["已授权", "Granted"],
    ["未授权", "Pending"],
    ["期刊", "Journal"],
    ["会议", "Conference"],
    ["T1、A类中文期刊", "T1, A-class Chinese Journal"],
    ["T1，A类中文期刊", "T1, A-class Chinese Journal"],
    ["A类国际期刊", "A-class International Journal"],
    ["B类国际期刊", "B-class International Journal"],
    ["C类国际期刊", "C-class International Journal"],
    ["A类国际会议", "A-class International Conference"],
    ["B类国际会议", "B-class International Conference"],
    ["C类国际会议", "C-class International Conference"],
    ["非SCI", "Non-SCI"],
    ["SCI 一区", "SCI Q1"],
    ["SCI 二区", "SCI Q2"],
    ["SCI 三区", "SCI Q3"],
    ["SCI 四区", "SCI Q4"],
    ["其他", "Other"],
    ["博士生", "PhD Students"],
    ["硕士生", "Master Students"],
    ["姓名：", "Name: "],
    ["入学年份：", "Entry Year: "],
    ["研究方向：", "Research Area: "],
    ["邮箱：", "Email: "],
    ["个人介绍：", "Biography: "],
    ["毕业去向：", "Destination: "],
    ["职称：", "Title: "],
    ["模糊测试工具", "Fuzzing Tools"],
    ["漏洞检测工具", "Vulnerability Detection Tools"]
  ];
  var TITLE_TRANSLATIONS = {
    "教授": "Professor",
    "副教授": "Associate Professor",
    "讲师": "Lecturer",
    "实验师": "Lab Engineer",
    "工程师": "Engineer"
  };
  var DIRECTION_TRANSLATIONS = {
    "软件测试及分析技术": "Software Testing and Analysis",
    "软件分析及测试技术": "Software Analysis and Testing",
    "软件测试、可信人工智能技术": "Software Testing and Trustworthy AI",
    "智能软件工程": "Intelligent Software Engineering",
    "可信人工智能": "Trustworthy Artificial Intelligence",
    "需求工程": "Requirements Engineering",
    "数据科学与智能系统、数据融合": "Data Science, Intelligent Systems, and Data Fusion",
    "光学无损检测及机器视觉领域": "Optical Nondestructive Testing and Machine Vision",
    "教育信息化": "Educational Informatization",
    "智能媒体、智能舆情、数字治理": "Intelligent Media, Public Opinion Analytics, and Digital Governance"
  };
  var TOOLS_DESCRIPTION_EN = {
    "DeltaFuzz": "DeltaFuzz quickly reaches code changes introduced by version iterations. It identifies changed locations, analyzes control-flow information from seed executions, and allocates more mutation effort to seeds with shorter distance to target basic blocks.",
    "CIDFuzz": "CIDFuzz targets changes introduced in continuous integration pipelines. It combines control-flow and data-flow information to prioritize seeds that are more likely to cover changed code quickly.",
    "DPFuzz": "DPFuzz improves bug-finding effectiveness by learning defect-proneness from code features and prioritizing fuzzing resources on modules with higher predicted defect likelihood.",
    "BaSFuzz": "BaSFuzz reduces redundant mutations on similar seeds by computing weighted byte-level and structural similarity scores, then prioritizing less similar seeds for mutation.",
    "SDA-FirmFuzz": "SDA-FirmFuzz performs differential seed analysis before fuzzing embedded firmware and executes more diverse seeds first, improving path coverage and crash triggering potential."
  };
  var STATIC_ZH_TO_EN = {};
  var STATIC_EN_TO_ZH = {};

  STATIC_TEXT_PAIRS.forEach(function (pair) {
    STATIC_ZH_TO_EN[pair[0]] = pair[1];
    STATIC_EN_TO_ZH[pair[1]] = pair[0];
  });

  function normalizeLang(lang) {
    var value = String(lang || "").trim().toLowerCase();
    return SUPPORTED_LANGS[value] ? value : "";
  }

  function readStoredLang() {
    try {
      return normalizeLang(window.localStorage.getItem(LANG_STORAGE_KEY));
    } catch (error) {
      return "";
    }
  }

  function writeStoredLang(lang) {
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch (error) {
      /* ignore storage failures */
    }
  }

  function parseLangFromSearch(search) {
    try {
      var params = new URLSearchParams(String(search || ""));
      return normalizeLang(params.get("lang"));
    } catch (error) {
      return "";
    }
  }

  function resolveInitialLanguage() {
    var fromQuery = parseLangFromSearch(window.location.search);
    if (fromQuery) {
      writeStoredLang(fromQuery);
      return fromQuery;
    }
    return readStoredLang() || DEFAULT_LANG;
  }

  function getCurrentLang() {
    return currentLang || DEFAULT_LANG;
  }

  function isEnglish() {
    return getCurrentLang() === "en";
  }

  function getLangPack() {
    var lang = getCurrentLang();
    return UI_TEXT[lang] || UI_TEXT[DEFAULT_LANG];
  }

  function getLabel(keyPath, fallback) {
    var pack = getLangPack();
    var segments = String(keyPath || "").split(".");
    var cursor = pack;
    var i;
    for (i = 0; i < segments.length; i += 1) {
      if (!cursor || typeof cursor !== "object") {
        return fallback;
      }
      cursor = cursor[segments[i]];
    }
    if (typeof cursor === "string") {
      return cursor;
    }
    return fallback;
  }

  function syncLanguageQueryParam() {
    var url;
    try {
      url = new URL(window.location.href);
    } catch (error) {
      return;
    }
    if (url.searchParams.get("lang") === getCurrentLang()) {
      return;
    }
    url.searchParams.set("lang", getCurrentLang());
    window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
  }

  function setCurrentLanguage(lang, shouldReload) {
    var nextLang = normalizeLang(lang);
    if (!nextLang || nextLang === getCurrentLang()) {
      return;
    }
    currentLang = nextLang;
    writeStoredLang(nextLang);
    syncLanguageQueryParam();
    if (shouldReload) {
      window.location.reload();
      return;
    }
    scheduleEnhancements(document);
  }

  function containsCJK(value) {
    return /[\u3400-\u9FFF]/.test(String(value || ""));
  }

  function isMostlyLatin(value) {
    var text = String(value || "");
    var letters = text.match(/[A-Za-z]/g);
    if (!letters || !letters.length) {
      return false;
    }
    return letters.length >= Math.max(Math.floor(text.length * 0.35), 4);
  }

  function getStaticTextMap() {
    return isEnglish() ? STATIC_ZH_TO_EN : STATIC_EN_TO_ZH;
  }

  function translateStaticText(text) {
    var normalized = normalizeText(text);
    if (!normalized) {
      return "";
    }
    return getStaticTextMap()[normalized] || "";
  }

  function translateTitle(title) {
    var normalized = normalizeText(title);
    if (!isEnglish() || !normalized) {
      return normalized;
    }
    return TITLE_TRANSLATIONS[normalized] || normalized;
  }

  function translateDirection(direction) {
    var normalized = normalizeText(direction);
    if (!isEnglish() || !normalized) {
      return normalized;
    }
    if (!containsCJK(normalized)) {
      return normalized;
    }
    if (DIRECTION_TRANSLATIONS[normalized]) {
      return DIRECTION_TRANSLATIONS[normalized];
    }
    var terms = normalized.split(/[、，,;；/]/).map(normalizeText).filter(Boolean);
    if (!terms.length) {
      return "Software Engineering";
    }
    var translated = terms.map(function (term) {
      return DIRECTION_TRANSLATIONS[term] || term;
    });
    var joined = translated.join(", ");
    if (containsCJK(joined)) {
      return "Software Engineering";
    }
    return joined;
  }

  function localizeYearLabel(text) {
    var normalized = normalizeText(text);
    if (!normalized) {
      return "";
    }
    if (isEnglish()) {
      var zhMatch = normalized.match(/^(\d{4})\s*级$/);
      if (zhMatch) {
        return "Class of " + zhMatch[1];
      }
      return normalized;
    }
    var enMatch = normalized.match(/^Class\s+of\s+(\d{4})$/i);
    if (enMatch) {
      return enMatch[1] + "级";
    }
    return normalized;
  }

  function toEnglishDate(value) {
    var text = normalizeText(value);
    var match = text.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日$/);
    if (!match) {
      return text;
    }
    var monthIndex = Number(match[2]) - 1;
    var day = Number(match[3]);
    var year = Number(match[1]);
    var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    if (monthIndex < 0 || monthIndex >= months.length || !day || !year) {
      return text;
    }
    return months[monthIndex] + " " + day + ", " + year;
  }

  function maybeDecodeCsvFromArrayBuffer(buffer) {
    var utf8Text = "";
    try {
      utf8Text = new TextDecoder("utf-8").decode(buffer);
    } catch (error) {
      utf8Text = "";
    }
    if (utf8Text && utf8Text.indexOf("\uFFFD") === -1) {
      return utf8Text;
    }
    try {
      return new TextDecoder("gb18030").decode(buffer);
    } catch (error) {
      return utf8Text;
    }
  }

  function stripBom(value) {
    return typeof value === "string" ? value.replace(/^\uFEFF/, "") : value;
  }

  function parseCsv(text) {
    var source = stripBom(String(text || "")).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    var rows = [];
    var row = [];
    var cell = "";
    var inQuotes = false;
    var i;

    for (i = 0; i < source.length; i += 1) {
      var ch = source.charAt(i);
      if (inQuotes) {
        if (ch === '"') {
          if (source.charAt(i + 1) === '"') {
            cell += '"';
            i += 1;
          } else {
            inQuotes = false;
          }
        } else {
          cell += ch;
        }
        continue;
      }

      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        row.push(cell);
        cell = "";
      } else if (ch === "\n") {
        row.push(cell);
        rows.push(row);
        row = [];
        cell = "";
      } else {
        cell += ch;
      }
    }

    if (cell.length > 0 || row.length > 0) {
      row.push(cell);
      rows.push(row);
    }

    if (!rows.length) {
      return [];
    }

    var headers = rows[0].map(function (header) {
      return stripBom(String(header || "")).trim();
    });

    return rows.slice(1).filter(function (cols) {
      return cols.some(function (col) {
        return String(col || "").trim() !== "";
      });
    }).map(function (cols) {
      var obj = {};
      headers.forEach(function (header, index) {
        obj[header] = typeof cols[index] === "undefined" ? "" : String(cols[index]);
      });
      return obj;
    });
  }

  function readCsv(path) {
    if (!dataCache[path]) {
      dataCache[path] = fetch(path)
        .then(function (response) {
          if (!response.ok) {
            throw new Error("Failed to fetch " + path + ": " + response.status);
          }
          return response.arrayBuffer();
        })
        .then(maybeDecodeCsvFromArrayBuffer)
        .then(parseCsv);
    }
    return dataCache[path];
  }

  function readJson(path) {
    if (!dataCache[path]) {
      dataCache[path] = fetch(path)
        .then(function (response) {
          if (!response.ok) {
            throw new Error("Failed to fetch " + path + ": " + response.status);
          }
          return response.json();
        });
    }
    return dataCache[path];
  }

  function isAlive(record) {
    var flag = record && (record.isDel || record.isdel || "0");
    return String(flag || "0") !== "1";
  }

  function includesAuthor(author, target) {
    var left = String(author || "");
    var right = String(target || "");
    return !!right && left.indexOf(right) !== -1;
  }

  function parseAuthorized(value) {
    var normalized = String(value || "").trim();
    if (normalized === "1" || normalized.toLowerCase() === "true") {
      return "1";
    }
    if (normalized === "0" || normalized.toLowerCase() === "false") {
      return "0";
    }
    return normalized;
  }

  function uniqueNonEmpty(values) {
    var map = {};
    var result = [];
    (values || []).forEach(function (value) {
      var normalized = normalizeText(value);
      if (!normalized || map[normalized]) {
        return;
      }
      map[normalized] = true;
      result.push(normalized);
    });
    return result;
  }

  function matchesAnyAuthor(author, candidates) {
    var list = uniqueNonEmpty(candidates);
    return list.some(function (candidate) {
      return includesAuthor(author, candidate);
    });
  }

  function expandAuthorCandidates(candidates) {
    var base = uniqueNonEmpty(candidates);
    if (!base.length) {
      return Promise.resolve(base);
    }
    return Promise.all([
      readCsv("data/teachers.csv").catch(function () { return []; }),
      readCsv("data/students.csv").catch(function () { return []; })
    ]).then(function (all) {
      var teachers = all[0] || [];
      var students = all[1] || [];
      var expandedMap = {};
      base.forEach(function (name) {
        expandedMap[name] = true;
      });

      function expandByRecords(records) {
        (records || []).filter(isAlive).forEach(function (record) {
          var zhName = normalizeText(record.name);
          var enName = normalizeText(record.name_en);
          if (expandedMap[zhName] && enName) {
            expandedMap[enName] = true;
          }
          if (expandedMap[enName] && zhName) {
            expandedMap[zhName] = true;
          }
        });
      }

      expandByRecords(teachers);
      expandByRecords(students);

      Object.keys(expandedMap).forEach(function (name) {
        var plainName = name.replace(/\(.*\)$/, "").trim();
        if (plainName) {
          expandedMap[plainName] = true;
        }
      });

      return Object.keys(expandedMap);
    }).catch(function () {
      return base;
    });
  }

  function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function summarizeText(value, maxLength) {
    var text = normalizeText(value);
    if (!text) {
      return "";
    }
    if (!maxLength || text.length <= maxLength) {
      return text;
    }
    return text.slice(0, Math.max(maxLength - 1, 1)).replace(/[，。；、,.;:!?！？]$/, "") + "…";
  }

  function toURL(input) {
    try {
      if (typeof input === "string") {
        return new URL(input, window.location.href);
      }
      if (input && typeof input.url === "string") {
        return new URL(input.url, window.location.href);
      }
    } catch (error) {
      return null;
    }
    return null;
  }

  function getApiPath(input) {
    var parsed = toURL(input);
    if (!parsed) {
      return null;
    }
    var host = parsed.hostname + (parsed.port ? ":" + parsed.port : "");
    if (!API_HOSTS[host]) {
      return null;
    }
    try {
      return decodeURIComponent(parsed.pathname || "/");
    } catch (error) {
      return parsed.pathname || "/";
    }
  }

  function getLocalPath(input) {
    var parsed = toURL(input);
    if (!parsed || parsed.origin !== window.location.origin) {
      return null;
    }
    try {
      return decodeURIComponent(parsed.pathname || "/");
    } catch (error) {
      return parsed.pathname || "/";
    }
  }

  function isNewsJsonPath(path) {
    return /\/data\/news\.json$/i.test(String(path || ""));
  }

  function isToolsJsonPath(path) {
    return /\/data\/tools\.json$/i.test(String(path || ""));
  }

  function clonePlainObject(input) {
    var source = input && typeof input === "object" ? input : {};
    var result = {};
    Object.keys(source).forEach(function (key) {
      result[key] = source[key];
    });
    return result;
  }

  function withEnglishTeacherIntro(teacher) {
    var intro = normalizeText(teacher.introduction);
    if (intro && !containsCJK(intro)) {
      return intro;
    }
    var name = normalizeText(teacher.name_en || teacher.name) || "Faculty member";
    var title = translateTitle(teacher.title) || "Faculty";
    var direction = translateDirection(teacher.direction) || "software engineering";
    return name + " is a " + title + " at the Software Engineering Research Center, BISTU. Research interests include " + direction + ".";
  }

  function withEnglishStudentIntro(student) {
    var intro = normalizeText(student.introduction);
    if (intro && !containsCJK(intro)) {
      return intro;
    }
    var name = normalizeText(student.name_en || student.name) || "Graduate student";
    var direction = translateDirection(student.direction) || "software engineering";
    return name + " is a graduate student at the Software Engineering Research Center, BISTU. Research interests include " + direction + ".";
  }

  function localizeDestination(destination) {
    var text = normalizeText(destination);
    if (!isEnglish() || !text) {
      return text;
    }
    if (!containsCJK(text)) {
      return text;
    }
    return text
      .replace(/（读博）/g, "(PhD)")
      .replace(/\(读博\)/g, "(PhD)")
      .replace(/（在读）/g, "(in progress)")
      .replace(/\(在读\)/g, "(in progress)");
  }

  function localizeTeacherRecord(record) {
    if (!record || !isEnglish()) {
      return record;
    }
    var teacher = clonePlainObject(record);
    teacher.name = normalizeText(record.name_en || record.name);
    teacher.title = translateTitle(record.title);
    teacher.direction = translateDirection(record.direction);
    teacher.introduction = withEnglishTeacherIntro(record);
    return teacher;
  }

  function localizeStudentRecord(record) {
    if (!record || !isEnglish()) {
      return record;
    }
    var student = clonePlainObject(record);
    student.name = normalizeText(record.name_en || record.name);
    student.direction = translateDirection(record.direction);
    student.introduction = withEnglishStudentIntro(record);
    student.destination = localizeDestination(record.destination);
    return student;
  }

  function localizeStudentGroupPayload(payload) {
    if (!payload || !isEnglish()) {
      return payload;
    }
    function mapGroupItems(items) {
      return (items || []).map(function (item) {
        var localized = clonePlainObject(item);
        localized.name = normalizeText(item.name_en || item.name);
        return localized;
      });
    }
    return {
      masterList: mapGroupItems(payload.masterList),
      phdList: mapGroupItems(payload.phdList)
    };
  }

  function localizePatentRecord(record) {
    if (!record || !isEnglish()) {
      return record;
    }
    var patent = clonePlainObject(record);
    if (patent.authorized === "1" || patent.authorized === 1 || patent.authorized === true) {
      patent.authorizedLabel = "Granted";
    } else {
      patent.authorizedLabel = "Pending";
    }
    return patent;
  }

  function localizePaperRecord(record) {
    if (!record || !isEnglish()) {
      return record;
    }
    return clonePlainObject(record);
  }

  function localizeResearchShowPayload(payload) {
    if (!payload || !isEnglish()) {
      return payload;
    }
    var localized = clonePlainObject(payload);
    localized.paper = (payload.paper || []).map(localizePaperRecord);
    return localized;
  }

  function normalizeNewsTitleEn(rawTitle, index) {
    var title = normalizeText(rawTitle);
    if (!title) {
      return "Research Update #" + String(index + 1);
    }
    if (!containsCJK(title)) {
      return title;
    }
    var chunks = title.split(/——|—|--/);
    var tail = normalizeText(chunks[chunks.length - 1] || "");
    if (tail && !containsCJK(tail)) {
      return "Research Update: " + tail;
    }
    return "Research Update #" + String(index + 1);
  }

  function localizeNewsTextBlock(text, index) {
    var normalized = normalizeText(text);
    if (!normalized || !containsCJK(normalized)) {
      return normalized;
    }
    var fallbacks = [
      "This update reports recent research progress from the SERC team.",
      "The work presents methods and empirical findings for software engineering practice.",
      "Please refer to the linked publication for complete technical details."
    ];
    return fallbacks[index % fallbacks.length];
  }

  function localizeNewsPayload(payload) {
    if (!payload || !isEnglish()) {
      return payload;
    }
    var newsList = Array.isArray(payload.news) ? payload.news : [];
    var localizedPayload = clonePlainObject(payload);
    localizedPayload.news = newsList.map(function (item, index) {
        var localized = clonePlainObject(item);
        localized.title = normalizeNewsTitleEn(item.title, index);
        localized.date = toEnglishDate(item.date);
        localized.content = Array.isArray(item.content)
          ? item.content.map(function (entry, contentIndex) {
            var block = clonePlainObject(entry);
            if (String(block.types || "").toLowerCase() === "text") {
              block.info = localizeNewsTextBlock(block.info, contentIndex);
            }
            return block;
          })
          : [];
        return localized;
      });
    return localizedPayload;
  }

  function localizeToolsPayload(payload) {
    if (!payload || !isEnglish()) {
      return payload;
    }
    var result = clonePlainObject(payload);
    var fuzzers = Array.isArray(payload.fuzzers) ? payload.fuzzers : [];
    result.fuzzers = fuzzers.map(function (group) {
      var localGroup = clonePlainObject(group);
      var type = normalizeText(group.type);
      if (type.indexOf("定向模糊测试") !== -1) {
        localGroup.type = "Directed Gray-box Fuzzing (DGF)";
      } else if (type.indexOf("覆盖率引导的模糊测试") !== -1) {
        localGroup.type = "Coverage-guided Gray-box Fuzzing (CGF)";
      } else {
        localGroup.type = containsCJK(type) ? "Research Fuzzing Tools" : type;
      }
      localGroup.tools = Array.isArray(group.tools) ? group.tools.map(function (tool) {
        var localTool = clonePlainObject(tool);
        var name = normalizeText(tool.name);
        localTool.name = name || tool.name;
        localTool.description = TOOLS_DESCRIPTION_EN[name] || localizeNewsTextBlock(tool.description, 0);
        return localTool;
      }) : [];
      return localGroup;
    });
    return result;
  }

  function localizeApiPayload(path, payload) {
    if (!isEnglish()) {
      return payload;
    }

    if (path === "/teacher/findAll") {
      return (payload || []).map(localizeTeacherRecord);
    }
    if (path.indexOf("/teacher/findByName/") === 0) {
      return localizeTeacherRecord(payload || {});
    }
    if (path === "/student/findYearAndName") {
      return localizeStudentGroupPayload(payload);
    }
    if (path.indexOf("/student/findByName/") === 0) {
      return localizeStudentRecord(payload || {});
    }
    if (path === "/paper/findAll" || path.indexOf("/paper/findByAuthor/") === 0) {
      return (payload || []).map(localizePaperRecord);
    }
    if (path === "/patent/findAll" ||
      path.indexOf("/patent/findByAuthorized/") === 0 ||
      path.indexOf("/patent/findByAuthor/") === 0) {
      return (payload || []).map(localizePatentRecord);
    }
    if (path === "/findResearchShow") {
      return localizeResearchShowPayload(payload);
    }
    return payload;
  }

  function localizeDataPayloadByPath(path, payload) {
    if (!isEnglish()) {
      return payload;
    }
    if (isNewsJsonPath(path)) {
      return localizeNewsPayload(payload);
    }
    if (isToolsJsonPath(path)) {
      return localizeToolsPayload(payload);
    }
    return payload;
  }

  function resolveDataPayload(path) {
    var cleanPath = String(path || "").replace(/^\//, "");
    return readJson(cleanPath).then(function (payload) {
      return localizeDataPayloadByPath(path, payload);
    });
  }

  function createStudentsGroupedPayload(students) {
    var masterList = [];
    var phdList = [];

    students.forEach(function (student) {
      var year = student.year || "";
      var item = {
        id: student.id,
        name: student.name,
        name_en: student.name_en,
        year: year,
        degree: student.degree
      };
      if (String(student.degree || "0") === "1") {
        phdList.push(item);
      } else {
        masterList.push(item);
      }
    });

    return {
      masterList: masterList,
      phdList: phdList
    };
  }

  function buildResearchShowPayload() {
    return Promise.all([
      readCsv("data/papers.csv"),
      readCsv("data/patents.csv"),
      readCsv("data/copyrights.csv")
    ]).then(function (all) {
      var papers = all[0].filter(isAlive);
      var patents = all[1].filter(isAlive);
      var copyrights = all[2].filter(isAlive);
      var journalCount = 0;
      var conferenceCount = 0;

      papers.forEach(function (paper) {
        var type = String(paper.type || "").toLowerCase();
        if (type.indexOf("journal") !== -1) {
          journalCount += 1;
        } else if (type.indexOf("conference") !== -1) {
          conferenceCount += 1;
        }
      });

      var authorizedCount = patents.filter(function (patent) {
        return parseAuthorized(patent.authorized) === "1";
      }).length;

      return {
        paper: papers,
        type_count: {
          conference: conferenceCount,
          journal: journalCount
        },
        patent: {
          authorized: authorizedCount,
          unauthorized: Math.max(patents.length - authorizedCount, 0)
        },
        copyright_num: copyrights.length
      };
    });
  }

  function resolveApiPayload(pathname) {
    var path = String(pathname || "");

    if (path === "/teacher/findAll") {
      return readCsv("data/teachers.csv").then(function (teachers) {
        return teachers.filter(isAlive);
      });
    }

    if (path.indexOf("/teacher/findByName/") === 0) {
      var teacherName = path.slice("/teacher/findByName/".length);
      return readCsv("data/teachers.csv").then(function (teachers) {
        return teachers.filter(isAlive).find(function (teacher) {
          return teacher.name === teacherName || teacher.name_en === teacherName;
        }) || {};
      });
    }

    if (path === "/student/findYearAndName") {
      return readCsv("data/students.csv").then(function (students) {
        return createStudentsGroupedPayload(students.filter(isAlive));
      });
    }

    if (path.indexOf("/student/findByName/") === 0) {
      var studentName = path.slice("/student/findByName/".length);
      return readCsv("data/students.csv").then(function (students) {
        return students.filter(isAlive).find(function (student) {
          return student.name === studentName || student.name_en === studentName;
        }) || {};
      });
    }

    if (path === "/paper/findAll") {
      return readCsv("data/papers.csv").then(function (papers) {
        return papers.filter(isAlive);
      });
    }

    if (path.indexOf("/paper/findByAuthor/") === 0) {
      var suffix = path.slice("/paper/findByAuthor/".length);
      var parts = suffix.split("/");
      var authorName = parts[0] || "";
      var authorNameEn = parts.slice(1).join("/") || "";
      return expandAuthorCandidates([authorName, authorNameEn]).then(function (authorCandidates) {
        return readCsv("data/papers.csv").then(function (papers) {
          return papers.filter(isAlive).filter(function (paper) {
            return matchesAnyAuthor(paper.author, authorCandidates);
          });
        });
      });
    }

    if (path === "/patent/findAll") {
      return readCsv("data/patents.csv").then(function (patents) {
        return patents.filter(isAlive);
      });
    }

    if (path.indexOf("/patent/findByAuthorized/") === 0) {
      var authorized = parseAuthorized(path.slice("/patent/findByAuthorized/".length));
      return readCsv("data/patents.csv").then(function (patents) {
        return patents.filter(isAlive).filter(function (patent) {
          return parseAuthorized(patent.authorized) === authorized;
        });
      });
    }

    if (path.indexOf("/patent/findByAuthor/") === 0) {
      var patentAuthor = path.slice("/patent/findByAuthor/".length);
      return expandAuthorCandidates([patentAuthor]).then(function (authorCandidates) {
        return readCsv("data/patents.csv").then(function (patents) {
          return patents.filter(isAlive).filter(function (patent) {
            return matchesAnyAuthor(patent.author, authorCandidates);
          });
        });
      });
    }

    if (path === "/copyright/findAll") {
      return readCsv("data/copyrights.csv").then(function (copyrights) {
        return copyrights.filter(isAlive);
      });
    }

    if (path === "/findResearchShow") {
      return buildResearchShowPayload();
    }

    return Promise.reject(new Error("No static fallback route for " + path));
  }

  function resolveLocalizedApiPayload(path) {
    return resolveApiPayload(path).then(function (payload) {
      return localizeApiPayload(path, payload);
    });
  }

  if (typeof window.fetch === "function") {
    var nativeFetch = window.fetch.bind(window);
    window.fetch = function (input, init) {
      var apiPath = getApiPath(input);
      if (apiPath) {
        return resolveLocalizedApiPayload(apiPath).then(function (payload) {
          return new Response(JSON.stringify(payload), {
            status: 200,
            headers: {
              "Content-Type": "application/json"
            }
          });
        }).catch(function () {
          return nativeFetch(input, init);
        });
      }

      var localPath = getLocalPath(input);
      var shouldLocalizeData = !!localPath && isEnglish() && (isNewsJsonPath(localPath) || isToolsJsonPath(localPath));
      if (!shouldLocalizeData) {
        return nativeFetch(input, init);
      }

      return nativeFetch(input, init).then(function (response) {
        if (!response || !response.ok) {
          return response;
        }
        return response.clone().json().then(function (payload) {
          var localized = localizeDataPayloadByPath(localPath, payload);
          return new Response(JSON.stringify(localized), {
            status: response.status,
            statusText: response.statusText,
            headers: {
              "Content-Type": "application/json"
            }
          });
        }).catch(function () {
          return response;
        });
      });
    };
  }

  if (typeof window.XMLHttpRequest !== "undefined") {
    var originalOpen = XMLHttpRequest.prototype.open;
    var originalSend = XMLHttpRequest.prototype.send;
    var originalSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;

    function callNativeOpen(xhr, method, url, asyncFlag, user, password) {
      if (typeof user !== "undefined") {
        originalOpen.call(xhr, method, url, asyncFlag, user, password);
      } else {
        originalOpen.call(xhr, method, url, asyncFlag);
      }
    }

    XMLHttpRequest.prototype.open = function (method, url, asyncFlag, user, password) {
      var apiPath = getApiPath(url);
      var localPath = getLocalPath(url);
      var shouldLocalizeData = !!localPath && isEnglish() && (isNewsJsonPath(localPath) || isToolsJsonPath(localPath));

      if (!apiPath && !shouldLocalizeData) {
        this.__sercFallbackMeta = null;
        return originalOpen.apply(this, arguments);
      }

      this.__sercFallbackMeta = {
        kind: apiPath ? "api" : "data",
        method: method,
        path: apiPath || localPath,
        asyncFlag: asyncFlag !== false,
        user: user,
        password: password,
        headers: []
      };
      return undefined;
    };

    XMLHttpRequest.prototype.setRequestHeader = function (name, value) {
      if (this.__sercFallbackMeta) {
        this.__sercFallbackMeta.headers.push([name, value]);
        return undefined;
      }
      return originalSetRequestHeader.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function (body) {
      var xhr = this;
      var meta = this.__sercFallbackMeta;

      if (!meta) {
        return originalSend.call(this, body);
      }

      this.__sercFallbackMeta = null;

      var payloadPromise = meta.kind === "api"
        ? resolveLocalizedApiPayload(meta.path)
        : resolveDataPayload(meta.path);

      payloadPromise.then(function (payload) {
        var blob = new Blob([JSON.stringify(payload)], {
          type: "application/json"
        });
        var blobUrl = URL.createObjectURL(blob);

        callNativeOpen(xhr, meta.method || "GET", blobUrl, meta.asyncFlag, meta.user, meta.password);

        meta.headers.forEach(function (entry) {
          try {
            originalSetRequestHeader.call(xhr, entry[0], entry[1]);
          } catch (error) {
            /* ignore invalid header in fallback mode */
          }
        });

        xhr.addEventListener("loadend", function cleanup() {
          URL.revokeObjectURL(blobUrl);
        }, { once: true });

        originalSend.call(xhr, null);
      }).catch(function () {
        callNativeOpen(xhr, meta.method || "GET", "data:application/json,%7B%7D", meta.asyncFlag, meta.user, meta.password);
        originalSend.call(xhr, null);
      });

      return undefined;
    };
  }

  function isElementNode(node) {
    return !!node && node.nodeType === 1;
  }

  function normalizeScopeRoot(root) {
    return isElementNode(root) ? root : document;
  }

  function getViewportWidth() {
    return Math.max(
      window.innerWidth || 0,
      document.documentElement ? document.documentElement.clientWidth : 0,
      document.body ? document.body.clientWidth : 0
    );
  }

  function isMobileViewport() {
    return getViewportWidth() < 992;
  }

  function syncBreakpointClasses() {
    var width = getViewportWidth();
    var activeClass = "bp-xl";
    if (width < 576) {
      activeClass = "bp-xs";
    } else if (width < 768) {
      activeClass = "bp-sm";
    } else if (width < 992) {
      activeClass = "bp-md";
    } else if (width < 1200) {
      activeClass = "bp-lg";
    }

    var targets = [document.documentElement, document.body];
    Array.prototype.forEach.call(targets, function (target) {
      if (!target || !target.classList) {
        return;
      }
      target.classList.remove("bp-xs", "bp-sm", "bp-md", "bp-lg", "bp-xl", "bp-mobile");
      target.classList.add(activeClass);
      target.classList.toggle("bp-mobile", width < 992);
    });
  }

  function matchesSelector(node, selector) {
    if (!isElementNode(node)) {
      return false;
    }
    if (typeof node.matches === "function") {
      return node.matches(selector);
    }
    var proto = window.Element ? window.Element.prototype : null;
    var fallback = proto && (proto.matches || proto.msMatchesSelector || proto.webkitMatchesSelector);
    return !!(fallback && fallback.call(node, selector));
  }

  function closestElement(node, selector) {
    var current = node;
    while (current && current !== document) {
      if (matchesSelector(current, selector)) {
        return current;
      }
      current = current.parentElement || current.parentNode;
    }
    return null;
  }

  function isReducedMotionPreferred() {
    if (!window.matchMedia) {
      return false;
    }
    try {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch (error) {
      return false;
    }
  }

  function collectImages(root) {
    var scope = normalizeScopeRoot(root);
    if (scope.tagName && scope.tagName.toLowerCase() === "img") {
      return [scope];
    }
    return scope.querySelectorAll ? scope.querySelectorAll("img") : [];
  }

  function markImageLoaded(img) {
    if (!img || !img.classList) {
      return;
    }
    img.classList.add("img-lazy-loaded");
    img.classList.remove("img-lazy-pending");
    img.dataset.lazyFxState = "loaded";
  }

  function bindImageLazyEffects(img, shouldAnimate) {
    if (!img || !img.classList) {
      return;
    }

    if (!shouldAnimate || isReducedMotionPreferred()) {
      markImageLoaded(img);
      return;
    }

    if (!img.dataset.lazyFxBound) {
      var onImageResolved = function () {
        markImageLoaded(img);
      };
      img.addEventListener("load", onImageResolved);
      img.addEventListener("error", onImageResolved);
      img.dataset.lazyFxBound = "1";
    }

    if (img.dataset.lazyFxState !== "loaded") {
      img.classList.add("img-lazy-pending");
      img.dataset.lazyFxState = "pending";
    }

    if (img.complete) {
      var resolvePromise = null;
      if (typeof img.decode === "function") {
        resolvePromise = img.decode().catch(function () {
          return null;
        });
      } else {
        resolvePromise = Promise.resolve();
      }
      resolvePromise.then(function () {
        markImageLoaded(img);
      });
    }
  }

  function optimizeImages(root) {
    var scope = normalizeScopeRoot(root);
    var isDocumentScope = scope === document;
    var images = collectImages(root);

    Array.prototype.forEach.call(images, function (img, index) {
      if (!img.getAttribute("decoding")) {
        img.setAttribute("decoding", "async");
      }

      var isCritical =
        !!img.closest("#ShowPicture") ||
        !!img.closest(".el-carousel") ||
        !!img.closest("#navbar") ||
        !!img.closest("nav") ||
        (isDocumentScope && index < 3);

      if (!isCritical && !img.getAttribute("loading")) {
        img.setAttribute("loading", "lazy");
      }

      if (!isCritical && !img.getAttribute("fetchpriority")) {
        img.setAttribute("fetchpriority", "low");
      } else if (!img.getAttribute("fetchpriority") && img.closest("#ShowPicture")) {
        img.setAttribute("fetchpriority", "high");
      }

      bindImageLazyEffects(img, !isCritical);
    });
  }

  function isCultureRoute() {
    return /^#\/culture(?:$|[/?])/.test(window.location.hash || "");
  }

  function getCultureImageObserver() {
    if (typeof IntersectionObserver === "undefined") {
      return null;
    }

    if (!cultureImageObserver) {
      cultureImageObserver = new IntersectionObserver(function (entries, observer) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) {
            return;
          }
          var target = entry.target;
          var lazySrc = target && target.dataset ? target.dataset.cultureLazySrc : "";
          if (lazySrc && !target.getAttribute("src")) {
            target.setAttribute("src", lazySrc);
            bindImageLazyEffects(target, true);
          }
          observer.unobserve(target);
        });
      }, {
        rootMargin: "220px 0px"
      });
    }

    return cultureImageObserver;
  }

  function releaseCultureImageObserver() {
    if (!cultureImageObserver) {
      return;
    }
    cultureImageObserver.disconnect();
    cultureImageObserver = null;
  }

  function enableCultureLazyImage(img, index, io) {
    if (!img || img.nodeType !== 1) {
      return;
    }

    img.setAttribute("decoding", "async");

    if (index < 8) {
      img.dataset.cultureLazyProcessed = "keep";
      bindImageLazyEffects(img, false);
      return;
    }

    if (img.dataset.cultureLazyApplied === "1") {
      return;
    }

    var originalSrc = img.getAttribute("src");
    if (!originalSrc) {
      return;
    }

    img.dataset.cultureLazySrc = originalSrc;
    img.dataset.cultureLazyApplied = "1";
    img.dataset.cultureLazyProcessed = "1";
    bindImageLazyEffects(img, true);
    img.removeAttribute("src");
    img.setAttribute("loading", "lazy");
    img.setAttribute("fetchpriority", "low");

    if (!io) {
      img.setAttribute("src", originalSrc);
      bindImageLazyEffects(img, true);
      return;
    }

    io.observe(img);
  }

  function optimizeCultureRouteImages(root) {
    if (!isCultureRoute()) {
      releaseCultureImageObserver();
      return;
    }

    var scope = normalizeScopeRoot(root);
    var cultureImages = [];

    if (
      scope.tagName &&
      scope.tagName.toLowerCase() === "img" &&
      scope.closest &&
      scope.closest("#culture_list")
    ) {
      cultureImages = [scope];
    } else if (scope.querySelectorAll) {
      cultureImages = scope.querySelectorAll("#culture_list img, #culture_list .el-image__inner");
    }

    var io = getCultureImageObserver();

    Array.prototype.forEach.call(cultureImages, function (img, index) {
      enableCultureLazyImage(img, index, io);
    });
  }

  function getRevealObserver() {
    if (typeof IntersectionObserver === "undefined" || isReducedMotionPreferred()) {
      return null;
    }

    if (!revealObserver) {
      revealObserver = new IntersectionObserver(function (entries, observer) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) {
            return;
          }
          var target = entry.target;
          if (target && target.classList) {
            target.classList.add("is-revealed");
            target.dataset.revealState = "revealed";
          }
          observer.unobserve(target);
        });
      }, {
        rootMargin: "0px 0px 18% 0px",
        threshold: 0.06
      });
    }

    return revealObserver;
  }

  function releaseRevealObserver() {
    if (!revealObserver) {
      return;
    }
    revealObserver.disconnect();
    revealObserver = null;
  }

  function shouldSkipRevealTarget(node) {
    if (!node || node.nodeType !== 1 || !node.classList) {
      return true;
    }

    if (node.dataset && node.dataset.revealOptOut === "1") {
      return true;
    }

    if (
      node.id === "ShowPicture" ||
      node.closest("#navbar") ||
      node.closest(".footer") ||
      node.closest(".el-image-viewer__wrapper")
    ) {
      return true;
    }

    var computed = null;
    if (typeof window.getComputedStyle === "function") {
      computed = window.getComputedStyle(node);
    }
    if (computed && (computed.display === "none" || computed.visibility === "hidden")) {
      return true;
    }

    return false;
  }

  function collectRevealTargets(root) {
    var scope = normalizeScopeRoot(root);
    var selector = [
      "#Introduction .features-box",
      "#news .section-title",
      "#news .row.margin-t-30 > [class*='col-']",
      "#teacher .section-title",
      "#teacher .team-box",
      "#direction .section-title",
      "#direction .pricing-box",
      "#research_show .section-title",
      "#research_show .services-box",
      "#research_show .el-card",
      "#project .section-title",
      "#project .services-box",
      "#student_list .main-title",
      "#student_list .degree-section",
      "#culture_list .route-page-title",
      "#culture_list .image-item.parent",
      "#tool_list .route-page-title",
      "#tool_list .el-card",
      "#new_list .route-page-title",
      "#new_list .row > [class*='col-']",
      "#about #Introduction .features-box",
      ".services-box",
      ".pricing-box",
      ".el-card",
      ".route-page-title",
      "#team_mentor_section .mentor-list li",
      "#student_list .student-list li",
      "#news .blog-box",
      "#student_info #student > *:not(script)"
    ].join(", ");
    var targets = [];

    function pushIfUnique(node) {
      if (!isElementNode(node)) {
        return;
      }
      if (targets.indexOf(node) !== -1) {
        return;
      }
      targets.push(node);
    }

    if (scope.nodeType === 1 && scope.matches && scope.matches(selector)) {
      pushIfUnique(scope);
    }

    if (scope.querySelectorAll) {
      var found = scope.querySelectorAll(selector);
      Array.prototype.forEach.call(found, function (node) {
        pushIfUnique(node);
      });
    }

    return targets;
  }

  function computeRevealDelay(node) {
    if (!node || !node.dataset) {
      return 0;
    }

    if (node.dataset.revealDelay) {
      var manual = parseInt(node.dataset.revealDelay, 10);
      return isFinite(manual) && manual > 0 ? manual : 0;
    }

    if ((window.innerWidth || 0) < 768) {
      return 0;
    }

    var staggerRoot = node.closest
      ? node.closest(".row, .student-list, .image-grid, .el-row, .el-tabs__content")
      : null;
    if (!staggerRoot) {
      return 0;
    }

    var siblingIndex = 0;
    var prev = node.previousElementSibling;
    while (prev) {
      siblingIndex += 1;
      prev = prev.previousElementSibling;
    }

    return Math.min(siblingIndex * 40, 220);
  }

  function revealImmediately(node) {
    if (!node || !node.classList) {
      return;
    }
    node.classList.add("is-revealed");
    node.dataset.revealState = "revealed";
  }

  function isNearViewport(node) {
    if (!node || typeof node.getBoundingClientRect !== "function") {
      return false;
    }
    var rect = node.getBoundingClientRect();
    var viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
    if (!viewportHeight) {
      return false;
    }
    return rect.top <= viewportHeight * 0.92;
  }

  function markRevealTargets(root) {
    var targets = collectRevealTargets(root);
    if (!targets.length) {
      return;
    }

    var observer = getRevealObserver();

    Array.prototype.forEach.call(targets, function (node) {
      if (shouldSkipRevealTarget(node)) {
        return;
      }

      if (!node.classList.contains("reveal-init")) {
        node.classList.add("reveal-init");
      }

      if (node.dataset.revealState === "revealed") {
        node.classList.add("is-revealed");
        return;
      }

      node.style.setProperty("--reveal-delay", computeRevealDelay(node) + "ms");

      if (!observer) {
        revealImmediately(node);
        return;
      }

      if (node.dataset.revealState !== "observed") {
        observer.observe(node);
        node.dataset.revealState = "observed";
      }

      if (isNearViewport(node)) {
        if (typeof window.requestAnimationFrame === "function") {
          window.requestAnimationFrame(function () {
            revealImmediately(node);
            observer.unobserve(node);
          });
        } else {
          revealImmediately(node);
          observer.unobserve(node);
        }
      }
    });
  }

  function shouldEnableHeroParallax() {
    var hash = getCurrentHash();
    var isHomeRoute = hash === "#/" || hash === "" || hash === "/";
    if (!isHomeRoute) {
      return false;
    }
    if (isReducedMotionPreferred()) {
      return false;
    }
    return (window.innerWidth || 0) >= 992;
  }

  function renderHeroParallax() {
    parallaxRafPending = false;

    var heroImage = document.querySelector("#ShowPicture img");
    if (!heroImage || !heroImage.style) {
      return;
    }

    if (!shouldEnableHeroParallax()) {
      heroImage.classList.remove("serc-parallax-active");
      heroImage.style.removeProperty("--serc-parallax-offset");
      return;
    }

    var rect = heroImage.getBoundingClientRect();
    var viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
    if (!viewportHeight) {
      return;
    }

    var centerDelta = rect.top + rect.height * 0.5 - viewportHeight * 0.5;
    var normalized = centerDelta / viewportHeight;
    if (normalized > 1) {
      normalized = 1;
    } else if (normalized < -1) {
      normalized = -1;
    }

    var maxOffset = 22;
    var offset = Math.round(-normalized * maxOffset);
    heroImage.classList.add("serc-parallax-active");
    heroImage.style.setProperty("--serc-parallax-offset", offset + "px");
  }

  function scheduleHeroParallax() {
    if (parallaxRafPending) {
      return;
    }
    parallaxRafPending = true;
    if (typeof window.requestAnimationFrame === "function") {
      window.requestAnimationFrame(renderHeroParallax);
    } else {
      window.setTimeout(renderHeroParallax, 16);
    }
  }

  function bindHeroParallaxListeners() {
    if (parallaxListenersBound) {
      return;
    }
    window.addEventListener("scroll", scheduleHeroParallax, { passive: true });
    parallaxListenersBound = true;
  }

  function runMotionEnhancements(root) {
    if (document.body && document.body.classList) {
      document.body.classList.add("motion-ready");
      document.body.classList.toggle("motion-reduced", isReducedMotionPreferred());
    }

    if (isReducedMotionPreferred()) {
      releaseRevealObserver();
    }

    markRevealTargets(root);
    bindHeroParallaxListeners();
    scheduleHeroParallax();
  }

  function setMetaContent(selector, content) {
    var node = document.querySelector(selector);
    if (!node || typeof content !== "string" || content === "") {
      return;
    }
    node.setAttribute("content", content);
  }

  function applyLanguageMeta() {
    var pack = getLangPack();
    if (document.documentElement) {
      document.documentElement.setAttribute("lang", pack.htmlLang);
    }
    if (document.body && document.body.classList) {
      document.body.classList.toggle("lang-en", isEnglish());
      document.body.classList.toggle("lang-zh", !isEnglish());
    }

    if (pack.siteTitle) {
      document.title = pack.siteTitle;
    }
    setMetaContent('meta[name="description"]', pack.siteDescription);
    setMetaContent('meta[property="og:locale"]', pack.ogLocale);
    setMetaContent('meta[property="og:title"]', pack.siteTitle);
    setMetaContent('meta[property="og:description"]', pack.siteDescription);
    setMetaContent('meta[name="twitter:title"]', pack.siteTitle);
    setMetaContent('meta[name="twitter:description"]', pack.siteDescription);
  }

  function ensureFooterContactStructure(line) {
    if (!line || line.nodeType !== 1) {
      return null;
    }

    var label = line.querySelector(".footer-contact-label");
    var value = line.querySelector(".footer-contact-value");
    if (label && value) {
      return {
        label: label,
        value: value
      };
    }

    var rawText = normalizeText(line.textContent || "");
    var match = rawText.match(/^([^：:]{1,24})[：:]\s*(.*)$/);
    var parsedLabel = match ? normalizeText(match[1]) : "";
    var parsedValue = match ? String(match[2] || "").trim() : rawText;

    line.innerHTML = "";
    label = document.createElement("span");
    label.className = "footer-contact-label";
    label.textContent = parsedLabel;
    value = document.createElement("span");
    value.className = "footer-contact-value";
    if (parsedValue) {
      value.textContent = parsedValue;
    }
    line.classList.add("footer-contact-line");
    line.appendChild(label);
    line.appendChild(value);
    return {
      label: label,
      value: value
    };
  }

  function alignFooterContactLine(line, key) {
    var nodes = ensureFooterContactStructure(line);
    if (!nodes) {
      return;
    }
    var footerPack = getLangPack().footer;
    var labelText = footerPack.labels[key] || "";
    var valueText = footerPack.values[key] || "";

    nodes.label.textContent = labelText;
    if (key === "homepage") {
      var link = nodes.value.querySelector("a");
      if (!link) {
        nodes.value.innerHTML = "";
        link = document.createElement("a");
        nodes.value.appendChild(link);
      }
      link.setAttribute("href", valueText);
      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noopener noreferrer");
      link.textContent = valueText;
    } else {
      nodes.value.textContent = valueText;
    }
    line.dataset.footerContactAligned = "1";
    line.dataset.footerContactLang = getCurrentLang();
  }

  function optimizeFooterContactLayout(root) {
    var scope = root && root.querySelectorAll ? root : document;
    var contactLines = scope.querySelectorAll
      ? scope.querySelectorAll(".footer .col-lg-4.margin-t-20:last-child .text-muted.margin-t-20 p")
      : [];
    var keys = ["address", "postcode", "email", "homepage"];

    Array.prototype.forEach.call(contactLines, function (line, index) {
      alignFooterContactLine(line, keys[index] || "address");
    });
  }

  function optimizeFooterBranding() {
    var brandTitle = document.querySelector(".footer .row > .col-lg-4.margin-t-20:first-child h4");
    if (brandTitle) {
      var prefix = getLabel("footer.brandPrefix", "©2026 ");
      var bodyText = isEnglish()
        ? "Software Engineering Research Center, BISTU"
        : "北京信息科技大学软件工程研究中心";
      brandTitle.textContent = prefix + bodyText;
    }
  }

  function optimizeNavbarBrand() {
    var brandContainer = document.querySelector("#navbar .container > div:first-child");
    if (!brandContainer) {
      return;
    }

    brandContainer.classList.add("serc-brand-container");
    brandContainer.style.marginLeft = "0";

    var link = brandContainer.querySelector("a");
    if (!link) {
      return;
    }

    link.classList.add("serc-brand-link");

    var hasCustomBrand =
      !!link.querySelector(".serc-brand-logo") &&
      !!link.querySelector(".serc-brand-title");

    if (!hasCustomBrand) {
      link.innerHTML = ""
        + '<span class="serc-brand-wrap">'
        + '<img class="serc-brand-logo" src="img/bistu_logo.png" alt="" decoding="async">'
        + '<span class="serc-brand-title"></span>'
        + "</span>";
    }

    var logo = link.querySelector(".serc-brand-logo");
    var title = link.querySelector(".serc-brand-title");
    if (logo) {
      logo.setAttribute("alt", getLabel("brandAlt", "BISTU Logo"));
    }
    if (title) {
      title.textContent = getLabel("brandTitle", "BISTU Software Engineering Research Center");
    }
  }

  function getNavbarRefs() {
    var navbar = document.querySelector("#navbar");
    if (!navbar || !navbar.querySelector) {
      return {
        navbar: null,
        container: null,
        collapse: null,
        toggle: null
      };
    }
    return {
      navbar: navbar,
      container: navbar.querySelector(".container"),
      collapse: navbar.querySelector("#navbarCollapse"),
      toggle: navbar.querySelector(".serc-mobile-nav-toggle")
    };
  }

  function syncMobileNavAria(toggle, collapse, expanded) {
    if (toggle) {
      toggle.setAttribute("aria-expanded", expanded ? "true" : "false");
      toggle.setAttribute(
        "aria-label",
        isEnglish()
          ? (expanded ? "Close navigation menu" : "Open navigation menu")
          : (expanded ? "关闭导航菜单" : "打开导航菜单")
      );
    }
    if (collapse) {
      if (isMobileViewport()) {
        collapse.setAttribute("aria-hidden", expanded ? "false" : "true");
      } else {
        collapse.removeAttribute("aria-hidden");
      }
    }
  }

  function setMobileNavExpanded(expanded) {
    var refs = getNavbarRefs();
    var collapse = refs.collapse;
    var toggle = refs.toggle;
    var shouldExpand = !!expanded && isMobileViewport();

    if (collapse && collapse.classList) {
      if (shouldExpand) {
        collapse.classList.add("show");
      } else {
        collapse.classList.remove("show");
      }
    }

    syncMobileNavAria(toggle, collapse, shouldExpand);

    if (document.body && document.body.classList) {
      document.body.classList.toggle("nav-open", shouldExpand);
    }
    if (document.documentElement && document.documentElement.classList) {
      document.documentElement.classList.toggle("nav-open", shouldExpand);
    }
  }

  function ensureMobileNavToggle() {
    var refs = getNavbarRefs();
    if (!refs.container || !refs.collapse) {
      return;
    }

    var toggle = refs.toggle;
    if (!toggle) {
      toggle = document.createElement("button");
      toggle.className = "serc-mobile-nav-toggle";
      toggle.type = "button";
      toggle.setAttribute("aria-controls", "navbarCollapse");
      toggle.innerHTML = '<span class="serc-mobile-nav-icon" aria-hidden="true"></span>';

      if (refs.collapse.parentNode === refs.container) {
        refs.container.insertBefore(toggle, refs.collapse);
      } else {
        refs.container.appendChild(toggle);
      }
    }

    var isExpanded =
      !!(refs.collapse.classList && refs.collapse.classList.contains("show")) && isMobileViewport();
    syncMobileNavAria(toggle, refs.collapse, isExpanded);
  }

  function bindMobileNavGlobalHandlers() {
    if (mobileNavGlobalHandlersBound) {
      return;
    }
    mobileNavGlobalHandlersBound = true;

    document.addEventListener("click", function (event) {
      var target = event.target;
      if (!target) {
        return;
      }

      var toggle = closestElement(target, ".serc-mobile-nav-toggle");
      if (toggle) {
        event.preventDefault();
        var expandedNow = toggle.getAttribute("aria-expanded") === "true";
        setMobileNavExpanded(!expandedNow);
        return;
      }

      if (!isMobileViewport()) {
        return;
      }

      var refs = getNavbarRefs();
      var collapse = refs.collapse;
      var isOpen = !!(collapse && collapse.classList && collapse.classList.contains("show"));
      if (!isOpen) {
        return;
      }

      if (
        closestElement(target, "#navbarCollapse .nav-link") ||
        closestElement(target, "#navbarCollapse .serc-lang-switch")
      ) {
        setMobileNavExpanded(false);
        return;
      }

      if (!closestElement(target, "#navbar")) {
        setMobileNavExpanded(false);
      }
    });

    document.addEventListener("keydown", function (event) {
      var key = event.key || "";
      if (key === "Escape" || key === "Esc" || event.keyCode === 27) {
        setMobileNavExpanded(false);
      }
    });

    window.addEventListener("hashchange", function () {
      setMobileNavExpanded(false);
    });

    window.addEventListener("resize", function () {
      if (mobileNavResizeTicking) {
        return;
      }
      mobileNavResizeTicking = true;
      var run = function () {
        mobileNavResizeTicking = false;
        ensureResponsiveShell();
      };
      if (typeof window.requestAnimationFrame === "function") {
        window.requestAnimationFrame(run);
      } else {
        window.setTimeout(run, 16);
      }
    });
  }

  function ensureResponsiveShell() {
    syncBreakpointClasses();
    ensureMobileNavToggle();
    bindMobileNavGlobalHandlers();

    var refs = getNavbarRefs();
    if (!refs.collapse) {
      return;
    }

    if (!isMobileViewport()) {
      setMobileNavExpanded(false);
      return;
    }

    var isExpanded = refs.collapse.classList && refs.collapse.classList.contains("show");
    syncMobileNavAria(refs.toggle, refs.collapse, !!isExpanded);
  }

  function markTableScrollContainers(root) {
    var scope = normalizeScopeRoot(root);
    var selector = [
      "#achievement_paper #paper",
      "#achievement_patent #paper",
      "#achievement_book #paper",
      "#achievement_copyright #paper"
    ].join(", ");
    var containers = scope.querySelectorAll ? scope.querySelectorAll(selector) : [];
    Array.prototype.forEach.call(containers, function (node) {
      if (node && node.classList) {
        node.classList.add("table-scroll");
      }
    });
  }

  function ensureAboutNavLink(root) {
    var scope = root && root.querySelectorAll ? root : document;
    var navLists = scope.querySelectorAll ? scope.querySelectorAll("#mySidenav") : [];

    Array.prototype.forEach.call(navLists, function (list) {
      if (!list || !list.querySelector) {
        return;
      }

      var link = list.querySelector('a.nav-link[href="#/about"]');
      if (!link) {
        var item = document.createElement("li");
        item.className = "nav-item";
        link = document.createElement("a");
        link.className = "nav-link";
        link.setAttribute("href", "#/about");
        item.appendChild(link);
        list.appendChild(item);
      }
      link.textContent = getLabel("nav.about", "About");
    });
  }

  function ensureLanguageSwitcher(root) {
    var scope = root && root.querySelectorAll ? root : document;
    var navLists = scope.querySelectorAll ? scope.querySelectorAll("#mySidenav") : [];

    Array.prototype.forEach.call(navLists, function (list) {
      if (!list) {
        return;
      }
      var item = list.querySelector(".serc-lang-switch-item");
      if (!item) {
        item = document.createElement("li");
        item.className = "nav-item serc-lang-switch-item";
        list.appendChild(item);
      }

      var button = item.querySelector(".serc-lang-switch");
      if (!button) {
        button = document.createElement("button");
        button.className = "nav-link serc-lang-switch";
        button.type = "button";
        item.appendChild(button);
      }

      var targetLang = isEnglish() ? "zh" : "en";
      button.textContent = isEnglish() ? "中文" : "EN";
      button.setAttribute("data-target-lang", targetLang);
      button.setAttribute("aria-label", isEnglish() ? "Switch to Chinese" : "切换到英文");

      if (button.dataset.boundClick !== "1") {
        button.addEventListener("click", function (event) {
          event.preventDefault();
          var next = this.getAttribute("data-target-lang");
          setCurrentLanguage(next, true);
        });
        button.dataset.boundClick = "1";
      }
    });
  }

  function normalizeNavLabels(root) {
    var scope = root && root.querySelectorAll ? root : document;
    var links = scope.querySelectorAll
      ? scope.querySelectorAll("#mySidenav a.nav-link, .footer-list a")
      : [];
    var nav = getLangPack().nav;

    var textFallbackMap = {
      "主页": "home",
      "首页": "home",
      "Home": "home",
      "中心动态": "news",
      "动态": "news",
      "News": "news",
      "学术成果": "achievement",
      "学术": "achievement",
      "Research": "achievement",
      "学生信息": "team",
      "团队": "team",
      "Team": "team",
      "People": "team",
      "中心建设": "culture",
      "文化": "culture",
      "Culture": "culture",
      "工具展示": "tool",
      "软件": "tool",
      "Software": "tool",
      "关于我们": "about",
      "关于": "about",
      "About": "about"
    };

    Array.prototype.forEach.call(links, function (link) {
      var href = String(link.getAttribute("href") || "").trim();
      var nextText = "";

      if (href === "/" || href === "#/") {
        nextText = nav.home;
      } else if (href.indexOf("#/newList") === 0) {
        nextText = nav.news;
      } else if (href.indexOf("#/achievement") === 0) {
        nextText = nav.achievement;
      } else if (href.indexOf("#/studentList") === 0) {
        nextText = nav.team;
      } else if (href.indexOf("#/culture") === 0) {
        nextText = nav.culture;
      } else if (href.indexOf("#/tool") === 0) {
        nextText = nav.tool;
      } else if (href.indexOf("#/about") === 0) {
        nextText = nav.about;
      } else {
        var currentText = String(link.textContent || "").trim();
        var key = textFallbackMap[currentText];
        if (key && nav[key]) {
          nextText = nav[key];
        }
      }

      if (nextText) {
        link.textContent = nextText;
      }
    });
  }

  function upsertRouteTitle(parent, beforeNode, text, key) {
    if (!parent) {
      return null;
    }

    var title = parent.querySelector('.route-page-title[data-route-title-key="' + key + '"]');
    if (!title) {
      title = document.createElement("h1");
      title.className = "route-page-title";
      title.dataset.routeTitleKey = key;
      if (beforeNode && beforeNode.parentNode === parent) {
        parent.insertBefore(title, beforeNode);
      } else {
        parent.insertBefore(title, parent.firstChild);
      }
    }
    title.textContent = text;
    return title;
  }

  function getCurrentHash() {
    var hash = String(window.location.hash || "#/").split("?")[0];
    if (hash === "" || hash === "#" || hash === "/") {
      return "#/";
    }
    return hash;
  }

  function ensureRoutePageTitles() {
    var hash = getCurrentHash();
    var routeText = getLangPack().route;

    var studentListTitle = document.querySelector("#student_list .main-title");
    if (studentListTitle) {
      studentListTitle.textContent = routeText.team;
    }

    var newsListTitle = document.querySelector("#new_list #student > h2, #new_list h2");
    if (newsListTitle) {
      newsListTitle.textContent = routeText.newsList;
      newsListTitle.classList.add("route-page-title");
      newsListTitle.dataset.routeTitleKey = "news-list";
    }

    var newsDetailTitle = document.querySelector("#student_info .el-page-header__content");
    if (newsDetailTitle) {
      var currentHeader = normalizeText(newsDetailTitle.textContent);
      if (
        currentHeader === "动态详情" ||
        currentHeader === "新闻详情" ||
        currentHeader === "News Detail"
      ) {
        newsDetailTitle.textContent = routeText.newsDetail;
      } else if (currentHeader === "学生信息" || currentHeader === "Student Profile") {
        newsDetailTitle.textContent = routeText.studentInfo;
      } else if (currentHeader === "导师信息" || currentHeader === "Faculty Profile") {
        newsDetailTitle.textContent = routeText.teacherInfo;
      }
    }

    if (hash === "#/achievement") {
      var achievementSection = document.querySelector(
        "#achievement_paper, #achievement_patent, #achievement_book, #achievement_copyright"
      );
      var achievementTabs = achievementSection ? achievementSection.closest(".el-tabs") : null;
      var achievementParent = achievementTabs
        ? achievementTabs.parentNode
        : (achievementSection ? achievementSection.parentNode : null);
      var achievementBeforeNode = achievementTabs || achievementSection;
      if (achievementParent) {
        upsertRouteTitle(achievementParent, achievementBeforeNode, routeText.achievement, "achievement");
      }
    }

    if (hash === "#/tool") {
      var toolSection = document.querySelector("#tool_fuzzer, #tool_vulDetector");
      var toolTabs = toolSection ? toolSection.closest(".el-tabs") : null;
      var toolParent = toolTabs ? toolTabs.parentNode : null;
      if (toolParent) {
        upsertRouteTitle(toolParent, toolTabs, routeText.tool, "tool");
      }
    }

    if (hash === "#/culture") {
      var cultureGrid = document.querySelector("#culture_list .image-grid");
      var cultureParent = cultureGrid ? cultureGrid.parentNode : null;
      if (cultureParent) {
        upsertRouteTitle(cultureParent, cultureGrid, routeText.culture, "culture");
      }
    }
  }

  function syncDecorativePageTitleText() {
    var selectors = [
      ".route-page-title",
      "#student_list .main-title",
      "#Introduction .features-box > h2"
    ];

    selectors.forEach(function (selector) {
      var nodes = document.querySelectorAll ? document.querySelectorAll(selector) : [];
      Array.prototype.forEach.call(nodes, function (node) {
        if (!node) {
          return;
        }
        var text = String(node.textContent || "").trim();
        if (text) {
          node.setAttribute("data-title-text", text);
        }
      });
    });
  }

  function normalizeTeamMentorSection() {
    var hash = getCurrentHash();
    if (hash.indexOf("#/studentList") !== 0) {
      return;
    }

    var container = document.querySelector("#student_list .student-container");
    if (!container) {
      return;
    }

    readCsv("data/teachers.csv").then(function (teachers) {
      var mentorList = (teachers || []).filter(isAlive).filter(function (teacher) {
        return String(teacher.name || "").trim() !== "";
      });

      if (!mentorList.length) {
        return;
      }

      var existing = container.querySelector("#team_mentor_section");
      if (
        existing &&
        existing.dataset.teacherCount === String(mentorList.length) &&
        existing.dataset.layoutVersion === "2" &&
        existing.dataset.lang === getCurrentLang()
      ) {
        return;
      }
      if (existing && existing.parentNode) {
        existing.parentNode.removeChild(existing);
      }

      var mentorSection = document.createElement("div");
      mentorSection.className = "degree-section team-mentor-section";
      mentorSection.id = "team_mentor_section";
      mentorSection.dataset.teacherCount = String(mentorList.length);
      mentorSection.dataset.layoutVersion = "2";
      mentorSection.dataset.lang = getCurrentLang();

      var mentorTitle = document.createElement("h2");
      mentorTitle.className = "degree-title";
      mentorTitle.textContent = getLabel("route.mentor", "Faculty");

      var mentorListNode = document.createElement("ul");
      mentorListNode.className = "student-list mentor-list";

      mentorList.forEach(function (teacher, index) {
        var name = isEnglish()
          ? normalizeText(teacher.name_en || teacher.name)
          : normalizeText(teacher.name);
        if (!name) {
          return;
        }

        var item = document.createElement("li");
        item.className = "mentor-item";
        item.dataset.index = String(index);

        var link = document.createElement("a");
        link.className = "student-name mentor-name";
        link.href = "#/teacherInfo?name=" + encodeURIComponent(name);
        link.textContent = name;

        var title = translateTitle(teacher.title);
        if (title) {
          var titleNode = document.createElement("span");
          titleNode.className = "mentor-title";
          titleNode.textContent = " · " + title;
          link.appendChild(titleNode);
        }

        item.appendChild(link);

        var summary = summarizeText(
          isEnglish() ? withEnglishTeacherIntro(teacher) : teacher.introduction,
          84
        );
        if (!summary) {
          summary = summarizeText(translateDirection(teacher.direction), 60);
        }
        if (summary) {
          var summaryNode = document.createElement("p");
          summaryNode.className = "mentor-summary team-item-meta";
          summaryNode.textContent = summary;
          item.appendChild(summaryNode);
        }

        mentorListNode.appendChild(item);
      });

      mentorSection.appendChild(mentorTitle);
      mentorSection.appendChild(mentorListNode);

      var firstDegreeSection = container.querySelector(".degree-section");
      if (firstDegreeSection && firstDegreeSection.parentNode === container) {
        container.insertBefore(mentorSection, firstDegreeSection);
      } else {
        container.appendChild(mentorSection);
      }
    }).catch(function () {
      /* ignore mentor section enhancement errors */
    });
  }

  function normalizeTeamStudentDirections() {
    var hash = getCurrentHash();
    if (hash.indexOf("#/studentList") !== 0) {
      return;
    }

    var container = document.querySelector("#student_list .student-container");
    if (!container) {
      return;
    }

    readCsv("data/students.csv").then(function (students) {
      var list = (students || []).filter(isAlive);
      var studentById = {};
      var studentByName = {};

      list.forEach(function (student) {
        var sid = normalizeText(student.id);
        var sname = normalizeText(student.name);
        var snameEn = normalizeText(student.name_en);
        if (sid) {
          studentById[sid] = student;
        }
        if (sname && !studentByName[sname]) {
          studentByName[sname] = student;
        }
        if (snameEn && !studentByName[snameEn]) {
          studentByName[snameEn] = student;
        }
      });

      var links = container.querySelectorAll
        ? container.querySelectorAll('a.student-name[href*="#/studentInfo?stuid="], a.student-name[href^="#/studentInfo"]')
        : [];

      Array.prototype.forEach.call(links, function (link) {
        var item = link.closest ? link.closest("li") : null;
        if (!item) {
          return;
        }

        var href = String(link.getAttribute("href") || "");
        var match = href.match(/[?&]stuid=([^&#]+)/i);
        var student = null;
        if (match && match[1]) {
          var sid = "";
          try {
            sid = decodeURIComponent(match[1]);
          } catch (error) {
            sid = match[1];
          }
          student = studentById[sid] || null;
        }
        if (!student) {
          student = studentByName[normalizeText(link.textContent)] || null;
        }

        if (student) {
          var displayName = isEnglish()
            ? normalizeText(student.name_en || student.name)
            : normalizeText(student.name);
          if (displayName && normalizeText(link.textContent) !== displayName) {
            link.textContent = displayName;
          }
        }

        var direction = student ? translateDirection(student.direction) : "";
        var directionNode = item.querySelector(".team-student-direction");

        if (!direction) {
          if (directionNode && directionNode.parentNode) {
            directionNode.parentNode.removeChild(directionNode);
          }
          return;
        }

        if (!directionNode) {
          directionNode = document.createElement("p");
          directionNode.className = "team-student-direction team-item-meta";
          if (link.nextSibling) {
            item.insertBefore(directionNode, link.nextSibling);
          } else {
            item.appendChild(directionNode);
          }
        }

        directionNode.textContent = direction;
      });
    }).catch(function () {
      /* ignore student direction enhancement errors */
    });
  }

  function applyAboutRouteMode() {
    var hash = getCurrentHash();
    var isAboutRoute = hash === "#/about";
    var isHomeRoute = hash === "#/" || hash === "" || hash === "/";
    var isCultureRouteActive = hash === "#/culture";

    if (document.body && document.body.classList) {
      document.body.classList.toggle("route-about", isAboutRoute);
      document.body.classList.toggle("route-home", isHomeRoute);
      document.body.classList.toggle("route-culture", isCultureRouteActive);
    }

    var sections = document.querySelectorAll ? document.querySelectorAll("#app .section") : [];
    Array.prototype.forEach.call(sections, function (section) {
      if (!section || !section.id) {
        return;
      }

      if (isAboutRoute) {
        if (section.id !== "Introduction") {
          if (section.dataset.aboutHiddenByRuntime !== "1") {
            section.dataset.aboutPrevDisplay = section.style.display || "";
          }
          section.style.display = "none";
          section.dataset.aboutHiddenByRuntime = "1";
        } else {
          section.style.display = "";
          section.dataset.aboutHiddenByRuntime = "";
        }
      } else if (section.dataset.aboutHiddenByRuntime === "1") {
        section.style.display = section.dataset.aboutPrevDisplay || "";
        section.dataset.aboutHiddenByRuntime = "";
        section.dataset.aboutPrevDisplay = "";
      }
    });
  }

  function syncImageViewerState() {
    var body = document.body;
    var html = document.documentElement;
    if (!body || !body.classList || !html || !html.classList) {
      return;
    }

    var viewer = document.querySelector(".el-image-viewer__wrapper");
    var isViewerOpen = false;
    if (viewer && viewer.parentNode) {
      var computed = null;
      if (typeof window.getComputedStyle === "function") {
        computed = window.getComputedStyle(viewer);
      }
      var displayValue = computed ? computed.display : viewer.style.display;
      var visibilityValue = computed ? computed.visibility : "";
      isViewerOpen = displayValue !== "none" && visibilityValue !== "hidden";
    }

    body.classList.toggle("viewer-open", isViewerOpen);
    html.classList.toggle("viewer-open", isViewerOpen);
  }

  function normalizeAboutSectionHeading() {
    var hash = getCurrentHash();
    var isAboutRoute = hash === "#/about";
    var heading = document.querySelector("#Introduction .features-box > h2");

    if (!heading) {
      return;
    }

    if (isAboutRoute) {
      if (!heading.dataset.aboutPrevText) {
        heading.dataset.aboutPrevText = String(heading.textContent || "").trim() || "基本情况";
      }
      heading.textContent = getLabel("route.about", "About");
      return;
    }

    if (heading.dataset.aboutPrevText) {
      heading.textContent = heading.dataset.aboutPrevText;
    }
  }

  function normalizeHomeIntroductionSummary() {
    var hash = getCurrentHash();
    var isHomeRoute = hash === "#/" || hash === "" || hash === "/";

    var introSection = document.querySelector("#Introduction");
    if (!introSection) {
      return;
    }

    var box = introSection.querySelector(".features-box");
    if (!box) {
      return;
    }

    if (introOriginalHtml === null) {
      introOriginalHtml = box.innerHTML;
    }

    if (isHomeRoute) {
      if (box.dataset.homeSummaryApplied === "1" && box.dataset.homeSummaryLang === getCurrentLang()) {
        return;
      }
      box.innerHTML = "";
      var paragraph = document.createElement("p");
      paragraph.className = "text-muted web-desc";
      paragraph.textContent = getLabel("home.summary", HOME_INTRO_SUMMARY_EN);
      box.appendChild(paragraph);
      box.dataset.homeSummaryApplied = "1";
      box.dataset.homeSummaryLang = getCurrentLang();
      return;
    }

    if (box.dataset.homeSummaryApplied === "1" && introOriginalHtml !== null) {
      box.innerHTML = introOriginalHtml;
      box.dataset.homeSummaryApplied = "";
      box.dataset.homeSummaryLang = "";
    }
  }

  function localizeAboutNarrative() {
    var isAboutRoute = getCurrentHash() === "#/about";
    var box = document.querySelector("#Introduction .features-box");
    if (!box) {
      return;
    }
    var paragraphs = box.querySelectorAll("p.text-muted.web-desc");
    if (!paragraphs.length) {
      return;
    }

    Array.prototype.forEach.call(paragraphs, function (paragraph, index) {
      if (!paragraph.dataset.originalZhText) {
        paragraph.dataset.originalZhText = normalizeText(paragraph.textContent);
      }
      if (isAboutRoute && isEnglish()) {
        paragraph.textContent = ABOUT_PARAGRAPHS_EN[index] || ABOUT_PARAGRAPHS_EN[ABOUT_PARAGRAPHS_EN.length - 1];
      } else if (paragraph.dataset.originalZhText) {
        paragraph.textContent = paragraph.dataset.originalZhText;
      }
    });
  }

  function localizeYearTitles() {
    var yearTitles = document.querySelectorAll ? document.querySelectorAll("#student_list .year-title") : [];
    Array.prototype.forEach.call(yearTitles, function (node) {
      var nextText = localizeYearLabel(node.textContent || "");
      if (nextText) {
        node.textContent = nextText;
      }
    });
  }

  function localizeMetricTexts() {
    var metrics = document.querySelectorAll ? document.querySelectorAll("#research_show h3") : [];
    Array.prototype.forEach.call(metrics, function (node) {
      var text = normalizeText(node.textContent || "");
      if (!text) {
        return;
      }
      if (isEnglish()) {
        text = text.replace(/^发表论文[:：]\s*/, "Publications: ");
        text = text.replace(/^提交专利[:：]\s*/, "Patent Applications: ");
        text = text.replace(/^申请软著[:：]\s*/, "Software Copyright Applications: ");
      } else {
        text = text.replace(/^Publications:\s*/i, "发表论文：");
        text = text.replace(/^Patent Applications:\s*/i, "提交专利：");
        text = text.replace(/^Software Copyright Applications:\s*/i, "申请软著：");
      }
      node.textContent = text;
    });

    var dividerTexts = document.querySelectorAll ? document.querySelectorAll("#student_info .el-divider__text") : [];
    Array.prototype.forEach.call(dividerTexts, function (node) {
      var text = normalizeText(node.textContent || "");
      if (!text) {
        return;
      }
      if (isEnglish()) {
        text = text.replace(/^发表论文\s*\((\d+)篇\)/, "Publications ($1)");
        text = text.replace(/^提交专利\s*\((\d+)项\)/, "Patents ($1)");
      } else {
        text = text.replace(/^Publications\s*\((\d+)\)/i, "发表论文 ($1篇)");
        text = text.replace(/^Patents\s*\((\d+)\)/i, "提交专利($1项)");
      }
      node.textContent = text;
    });

  }

  function localizeStaticTextNodes(root) {
    var scope = root && root.querySelectorAll ? root : document;
    var candidates = scope.querySelectorAll
      ? scope.querySelectorAll(
        ".section h1, .section h2, .section h3, .section h4, .section h5, .section h6," +
        ".section p, .section span, .section b, .section .el-tag, .section .el-form-item__label," +
        ".section .el-table th .cell, .section .el-divider__text, .section .el-checkbox-button span, .section .el-tabs__item," +
        ".el-tag, .el-form-item__label, .el-table th .cell, .el-divider__text, .el-checkbox-button span, .el-tabs__item," +
        "#student_info span, #student_info .el-page-header__content"
      )
      : [];

    Array.prototype.forEach.call(candidates, function (node) {
      var allowNestedText = !!(node && node.classList && node.classList.contains("el-tabs__item"));
      if (!node || ((node.children && node.children.length > 0) && !allowNestedText)) {
        return;
      }
      var text = normalizeText(node.textContent || "");
      if (!text) {
        return;
      }
      var translated = translateStaticText(text);
      if (translated && translated !== text) {
        node.textContent = translated;
      }
    });
  }

  function syncNavActiveState() {
    var hash = getCurrentHash();

    var links = document.querySelectorAll ? document.querySelectorAll("#mySidenav a.nav-link") : [];
    Array.prototype.forEach.call(links, function (link) {
      var item = link && link.parentElement;
      if (item && item.classList) {
        item.classList.remove("active");
      }
    });

    var activeHref = null;
    if (hash === "#/" || hash === "/") {
      activeHref = "/";
    } else if (hash.indexOf("#/newList") === 0 || hash.indexOf("#/newInfo") === 0) {
      activeHref = "#/newList";
    } else if (hash.indexOf("#/achievement") === 0) {
      activeHref = "#/achievement";
    } else if (hash.indexOf("#/studentList") === 0 || hash.indexOf("#/studentInfo") === 0 || hash.indexOf("#/teacherInfo") === 0) {
      activeHref = "#/studentList";
    } else if (hash.indexOf("#/culture") === 0) {
      activeHref = "#/culture";
    } else if (hash.indexOf("#/tool") === 0) {
      activeHref = "#/tool";
    } else if (hash.indexOf("#/about") === 0) {
      activeHref = "#/about";
    }

    if (!activeHref) {
      return;
    }

    Array.prototype.forEach.call(links, function (link) {
      var href = String(link.getAttribute("href") || "").trim();
      var matched = href === activeHref;
      if (!matched && activeHref === "/" && href === "#/") {
        matched = true;
      }
      if (matched && link.parentElement && link.parentElement.classList) {
        link.parentElement.classList.add("active");
      }
    });
  }

  function normalizeHomeSectionTitles() {
    var hash = getCurrentHash();
    if (hash !== "#/") {
      return;
    }
    var home = getLangPack().home;

    var newsTitle = document.querySelector("#news .section-title");
    if (newsTitle) {
      newsTitle.textContent = home.news;
    }

    var teacherTitle = document.querySelector("#teacher .section-title");
    if (teacherTitle) {
      teacherTitle.textContent = home.team;
    }

    var projectTitle = document.querySelector("#project .section-title");
    if (projectTitle) {
      projectTitle.textContent = home.project;
    }
  }

  function runLayoutEnhancements(root) {
    var scope = normalizeScopeRoot(root);
    optimizeImages(scope);
    optimizeCultureRouteImages(scope);
    optimizeFooterContactLayout(scope);
    markTableScrollContainers(scope);
  }

  function runStructuralEnhancements() {
    ensureResponsiveShell();
    applyLanguageMeta();
    optimizeFooterBranding();
    optimizeNavbarBrand();
    ensureAboutNavLink(document);
    ensureLanguageSwitcher(document);
    normalizeNavLabels(document);
    ensureRoutePageTitles();
    normalizeTeamMentorSection();
    normalizeTeamStudentDirections();
    normalizeHomeSectionTitles();
    applyAboutRouteMode();
    syncImageViewerState();
    normalizeAboutSectionHeading();
    normalizeHomeIntroductionSummary();
    localizeAboutNarrative();
    localizeYearTitles();
    localizeMetricTexts();
    localizeStaticTextNodes(document);
    syncDecorativePageTitleText();
    syncNavActiveState();
  }

  function runAllEnhancements(root) {
    runLayoutEnhancements(root);
    runStructuralEnhancements();
    runMotionEnhancements(root);
  }

  function mergeScheduledRoot(nextRoot) {
    var next = normalizeScopeRoot(nextRoot);
    var current = enhancementScheduledRoot;

    if (!current || current === document) {
      enhancementScheduledRoot = next;
      return;
    }

    if (next === document) {
      enhancementScheduledRoot = document;
      return;
    }

    if (current.contains && current.contains(next)) {
      return;
    }

    if (next.contains && next.contains(current)) {
      enhancementScheduledRoot = next;
      return;
    }

    enhancementScheduledRoot = document;
  }

  function scheduleEnhancements(root) {
    mergeScheduledRoot(root);

    if (enhancementQueuePending) {
      return;
    }

    enhancementQueuePending = true;
    var runner = function () {
      enhancementQueuePending = false;
      var scheduledRoot = enhancementScheduledRoot || document;
      enhancementScheduledRoot = null;
      runAllEnhancements(scheduledRoot);
    };

    if (typeof window.requestAnimationFrame === "function") {
      window.requestAnimationFrame(runner);
    } else {
      window.setTimeout(runner, 16);
    }
  }

  function isMutationNodeRelevant(node) {
    if (!isElementNode(node)) {
      return false;
    }
    var tag = node.tagName ? node.tagName.toLowerCase() : "";
    return tag !== "script" && tag !== "style" && tag !== "link" && tag !== "meta";
  }

  function detectMutationRoot(mutations) {
    var root = null;
    var hasRelevantMutation = false;

    function mergeRoot(nodeRoot) {
      if (!nodeRoot) {
        return;
      }

      if (!root) {
        root = nodeRoot;
        return;
      }

      if (root === document || nodeRoot === document) {
        root = document;
        return;
      }

      if (root.contains && root.contains(nodeRoot)) {
        return;
      }

      if (nodeRoot.contains && nodeRoot.contains(root)) {
        root = nodeRoot;
        return;
      }

      root = document;
    }

    function registerMutationNode(node, fallbackRoot) {
      if (!isMutationNodeRelevant(node)) {
        return;
      }

      hasRelevantMutation = true;
      var nodeRoot = node;
      if (node.tagName && node.tagName.toLowerCase() === "img") {
        nodeRoot = node.parentNode || fallbackRoot || node;
      } else if (
        node.classList &&
        typeof node.classList.contains === "function" &&
        node.classList.contains("el-image-viewer__wrapper")
      ) {
        nodeRoot = document;
      } else if (!node.parentNode && fallbackRoot) {
        nodeRoot = fallbackRoot;
      }

      mergeRoot(nodeRoot);
    }

    mutations.forEach(function (mutation) {
      Array.prototype.forEach.call(mutation.addedNodes || [], function (node) {
        registerMutationNode(node, mutation.target || document);
      });

      Array.prototype.forEach.call(mutation.removedNodes || [], function (node) {
        registerMutationNode(node, mutation.target || document);
      });
    });

    if (!hasRelevantMutation) {
      return null;
    }

    return root || document;
  }

  function bootEnhancements() {
    syncLanguageQueryParam();
    runAllEnhancements(document);
    scheduleEnhancements(document);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootEnhancements);
  } else {
    bootEnhancements();
  }

  window.addEventListener("load", function () {
    scheduleEnhancements(document);
  });

  window.addEventListener("hashchange", function () {
    scheduleEnhancements(document);
  });

  window.addEventListener("resize", function () {
    if (resizeDebounceTimer !== null) {
      window.clearTimeout(resizeDebounceTimer);
    }
    resizeDebounceTimer = window.setTimeout(function () {
      resizeDebounceTimer = null;
      scheduleEnhancements(document);
    }, 140);
  });

  if (typeof MutationObserver !== "undefined") {
    var observer = new MutationObserver(function (mutations) {
      var mutationRoot = detectMutationRoot(mutations);
      if (mutationRoot) {
        scheduleEnhancements(mutationRoot);
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }
})();
