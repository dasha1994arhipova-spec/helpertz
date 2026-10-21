(function () {
  "use strict";

  var form = document.getElementById("tz-form");
  var actionsList = document.getElementById("actions-list");
  var addActionBtn = document.getElementById("add-action");
  var clearBtn = document.getElementById("clear-btn");
  var resultArea = document.getElementById("result");
  var lastBuiltText = "";
  var actionCounter = 0;

  function trim(value) {
    return (value || "").replace(/^\s+|\s+$/g, "");
  }

  function hasText(value) {
    return trim(value).length > 0;
  }

  function getRadioValue(name) {
    var checked = form.querySelector('input[name="' + name + '"]:checked');
    return checked ? checked.value : "";
  }

  function createActionRow(value) {
    actionCounter += 1;
    var id = "action-" + actionCounter;
    var row = document.createElement("div");
    row.className = "action-row";

    var input = document.createElement("input");
    input.type = "text";
    input.className = "action-input";
    input.id = id;
    input.name = "actions";
    input.placeholder = "Например: записаться на занятие";
    input.setAttribute("aria-label", "Действие пользователя");
    if (value) {
      input.value = value;
    }

    var removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "btn-icon";
    removeBtn.setAttribute("aria-label", "Удалить действие");
    removeBtn.title = "Удалить";
    removeBtn.textContent = "×";
    removeBtn.addEventListener("click", function () {
      var rows = actionsList.querySelectorAll(".action-row");
      if (rows.length <= 1) {
        input.value = "";
        input.focus();
        return;
      }
      row.remove();
      updateRemoveButtons();
    });

    row.appendChild(input);
    row.appendChild(removeBtn);
    return row;
  }

  function updateRemoveButtons() {
    var rows = actionsList.querySelectorAll(".action-row");
    rows.forEach(function (row) {
      var btn = row.querySelector(".btn-icon");
      if (btn) {
        btn.disabled = rows.length <= 1;
      }
    });
  }

  function getActions() {
    var inputs = actionsList.querySelectorAll(".action-input");
    var actions = [];
    inputs.forEach(function (input) {
      var value = trim(input.value);
      if (value) {
        actions.push(value);
      }
    });
    return actions;
  }

  function clearErrors() {
    form.querySelectorAll(".error").forEach(function (el) {
      el.hidden = true;
      el.textContent = "";
    });
    form.querySelectorAll(".has-error").forEach(function (el) {
      el.classList.remove("has-error");
    });
  }

  function showError(fieldEl, errorId, message, focusTarget) {
    fieldEl.classList.add("has-error");
    var errorEl = document.getElementById(errorId);
    errorEl.hidden = false;
    errorEl.textContent = message;
    return focusTarget;
  }

  function validate() {
    clearErrors();
    var firstFocus = null;

    var ideaField = document.getElementById("product-idea").closest(".field");
    var ideaInput = document.getElementById("product-idea");
    if (!hasText(ideaInput.value)) {
      firstFocus = showError(
        ideaField,
        "error-product-idea",
        "Опишите, что хотите создать.",
        firstFocus || ideaInput
      );
    }

    var audienceField = document.getElementById("audience").closest(".field");
    var audienceInput = document.getElementById("audience");
    if (!hasText(audienceInput.value)) {
      firstFocus = showError(
        audienceField,
        "error-audience",
        "Укажите, для кого создаётся продукт.",
        firstFocus || audienceInput
      );
    }

    var problemField = document.getElementById("user-problem").closest(".field");
    var problemInput = document.getElementById("user-problem");
    if (!hasText(problemInput.value)) {
      firstFocus = showError(
        problemField,
        "error-user-problem",
        "Опишите задачу пользователя.",
        firstFocus || problemInput
      );
    }

    var actionsField = document.getElementById("actions-field");
    var actions = getActions();
    if (actions.length === 0) {
      actionsList.classList.add("has-error");
      var errorEl = document.getElementById("error-actions");
      errorEl.hidden = false;
      errorEl.textContent = "Добавьте хотя бы одно действие пользователя.";
      var firstActionInput = actionsList.querySelector(".action-input");
      firstFocus = firstFocus || firstActionInput;
    }

    if (firstFocus) {
      firstFocus.focus();
      if (typeof firstFocus.scrollIntoView === "function") {
        firstFocus.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return null;
    }

    return collectAnswers(actions);
  }

  function collectAnswers(actions) {
    return {
      projectName: trim(document.getElementById("project-name").value),
      productIdea: trim(document.getElementById("product-idea").value),
      productType: document.getElementById("product-type").value,
      audience: trim(document.getElementById("audience").value),
      userProblem: trim(document.getElementById("user-problem").value),
      actions: actions,
      pages: trim(document.getElementById("pages").value),
      inputData: trim(document.getElementById("input-data").value),
      outputResult: trim(document.getElementById("output-result").value),
      needAuth: getRadioValue("needAuth"),
      needPay: getRadioValue("needPay"),
      needSave: getRadioValue("needSave"),
      needAi: getRadioValue("needAi"),
      outOfScope: trim(document.getElementById("out-of-scope").value),
      designWish: trim(document.getElementById("design-wish").value),
      references: trim(document.getElementById("references").value),
      device: getRadioValue("device"),
      tech: trim(document.getElementById("tech").value),
      constraints: trim(document.getElementById("constraints").value),
      successSignal: trim(document.getElementById("success-signal").value),
      mustWork: trim(document.getElementById("must-work").value)
    };
  }

  function preserveMultiline(text) {
    return text;
  }

  function asListOrBlock(text) {
    if (!hasText(text)) {
      return null;
    }
    return preserveMultiline(text);
  }

  function bulletList(items) {
    return items.map(function (item) {
      return "- " + item;
    }).join("\n");
  }

  function featureLine(label, value, clarifications, yesNote) {
    if (value === "Пока не знаю" || !value) {
      clarifications.push("Нужна ли " + label + " в первой версии?");
      return "- **" + label + ":** пока не определено — уточнить перед реализацией.";
    }
    if (value === "Да") {
      if (yesNote) {
        clarifications.push(yesNote);
      }
      return "- **" + label + ":** да.";
    }
    return "- **" + label + ":** нет.";
  }

  function buildDocument(data) {
    var clarifications = [];
    var lines = [];

    lines.push("# Техническое задание");
    lines.push("");

    // 1. Название и описание
    lines.push("## 1. Название и описание продукта");
    lines.push("");
    if (data.projectName) {
      lines.push("**Название:** " + data.projectName);
      lines.push("");
    } else {
      clarifications.push("Как назвать проект?");
      lines.push("**Название:** не указано — уточнить при необходимости.");
      lines.push("");
    }
    if (data.productType) {
      lines.push("**Тип продукта:** " + data.productType);
      lines.push("");
    } else {
      clarifications.push("Какой тип продукта подходит точнее всего?");
      lines.push("**Тип продукта:** не выбран — уточнить.");
      lines.push("");
    }
    lines.push("**Описание:**");
    lines.push(preserveMultiline(data.productIdea));
    lines.push("");

    // 2. Аудитория
    lines.push("## 2. Целевая аудитория");
    lines.push("");
    lines.push(preserveMultiline(data.audience));
    lines.push("");

    // 3. Задача и результат
    lines.push("## 3. Задача и ожидаемый результат");
    lines.push("");
    lines.push("**Задача пользователя:**");
    lines.push(preserveMultiline(data.userProblem));
    lines.push("");
    if (hasText(data.outputResult)) {
      lines.push("**Ожидаемый результат для пользователя:**");
      lines.push(preserveMultiline(data.outputResult));
    } else {
      clarifications.push("Какой результат должен получать пользователь после основных действий?");
      lines.push("**Ожидаемый результат для пользователя:** не описан — нужно уточнить.");
    }
    lines.push("");

    // 4. Состав первой версии
    lines.push("## 4. Состав первой версии");
    lines.push("");
    lines.push("Основные действия пользователя:");
    lines.push(bulletList(data.actions));
    lines.push("");

    // 5. Сценарий
    lines.push("## 5. Основной пользовательский сценарий");
    lines.push("");
    lines.push("Последовательность шагов сценария в форме не описана отдельно.");
    lines.push("Ниже — список основных действий; полный сценарий «от входа до результата» нужно уточнить перед реализацией.");
    lines.push("");
    lines.push(bulletList(data.actions));
    lines.push("");
    clarifications.push("Опишите основной пользовательский сценарий по шагам: с чего начинается использование и чем заканчивается.");

    // 6. Страницы
    lines.push("## 6. Страницы, экраны или разделы");
    lines.push("");
    if (hasText(data.pages)) {
      lines.push(asListOrBlock(data.pages));
    } else {
      clarifications.push("Какие страницы, экраны или разделы нужны в первой версии?");
      lines.push("Не указаны — нужно уточнить.");
    }
    lines.push("");

    // 7. Данные и результаты
    lines.push("## 7. Вводимые данные и результаты");
    lines.push("");
    if (hasText(data.inputData)) {
      lines.push("**Пользователь вводит:**");
      lines.push(preserveMultiline(data.inputData));
    } else {
      clarifications.push("Какие данные пользователь вводит?");
      lines.push("**Пользователь вводит:** не указано — уточнить.");
    }
    lines.push("");
    if (hasText(data.outputResult)) {
      lines.push("**Пользователь получает:**");
      lines.push(preserveMultiline(data.outputResult));
    } else {
      lines.push("**Пользователь получает:** не указано — уточнить.");
    }
    lines.push("");

    // 8. Регистрация и др.
    lines.push("## 8. Регистрация, оплата, сохранение данных и AI");
    lines.push("");
    lines.push(
      featureLine(
        "Регистрация / вход",
        data.needAuth,
        clarifications,
        "Если нужна регистрация или вход: отдельно определить сервис и способ безопасного подключения (без запроса паролей, токенов и секретных ключей в чате)."
      )
    );
    lines.push(
      featureLine(
        "Оплата",
        data.needPay,
        clarifications,
        "Если нужна оплата: отдельно определить платёжный сервис и способ безопасного подключения."
      )
    );
    lines.push(
      featureLine(
        "Сохранение данных",
        data.needSave,
        clarifications,
        "Если нужно сохранение данных: уточнить, что именно хранить и где."
      )
    );
    lines.push(
      featureLine(
        "AI",
        data.needAi,
        clarifications,
        "Если нужен AI: отдельно определить сервис и способ безопасного подключения (без запроса ключей в чате)."
      )
    );
    lines.push("");

    // 9. Дизайн
    lines.push("## 9. Дизайн и адаптивность");
    lines.push("");
    if (hasText(data.designWish)) {
      lines.push("**Стиль, цвета и настроение:**");
      lines.push(preserveMultiline(data.designWish));
      lines.push("");
    } else {
      clarifications.push("Какой стиль, цвета и настроение нужны продукту?");
      lines.push("**Стиль, цвета и настроение:** не указаны — уточнить.");
      lines.push("");
    }
    if (hasText(data.references)) {
      lines.push("**Референсы:**");
      lines.push(preserveMultiline(data.references));
      lines.push("");
    } else {
      lines.push("**Референсы:** не указаны.");
      lines.push("");
    }
    if (data.device) {
      lines.push("**Где пользуются:** " + data.device + ".");
    } else {
      clarifications.push("Где будут пользоваться продуктом: компьютер, телефон или оба?");
      lines.push("**Где пользуются:** пока не определено — уточнить.");
    }
    lines.push("");

    // 10. Технологии
    lines.push("## 10. Технологии и ограничения");
    lines.push("");
    if (hasText(data.tech)) {
      lines.push("**Технологии / платформа (указаны пользователем):**");
      lines.push(preserveMultiline(data.tech));
    } else {
      lines.push("Предложи подходящие технологии и объясни выбор перед реализацией.");
    }
    lines.push("");
    if (hasText(data.constraints)) {
      lines.push("**Дополнительные ограничения и пожелания:**");
      lines.push(preserveMultiline(data.constraints));
    } else {
      lines.push("**Дополнительные ограничения и пожелания:** не указаны.");
    }
    lines.push("");

    // 11. Вне объёма
    lines.push("## 11. Что не входит в первую версию");
    lines.push("");
    if (hasText(data.outOfScope)) {
      lines.push(preserveMultiline(data.outOfScope));
    } else {
      clarifications.push("Что сознательно не входит в первую версию?");
      lines.push("Не указано — уточнить, чтобы не расширять объём без согласования.");
    }
    lines.push("");

    // 12. Критерии приёмки
    lines.push("## 12. Критерии приёмки");
    lines.push("");
    if (hasText(data.successSignal)) {
      lines.push("**Как понять, что продукт работает:**");
      lines.push(preserveMultiline(data.successSignal));
      lines.push("");
    } else {
      clarifications.push("Как пользователь поймёт, что продукт работает?");
      lines.push("**Как понять, что продукт работает:** не указано — уточнить.");
      lines.push("");
    }
    if (hasText(data.mustWork)) {
      lines.push("**Обязательно должны успешно выполняться:**");
      lines.push(preserveMultiline(data.mustWork));
    } else {
      clarifications.push("Какие действия обязательно должны успешно выполняться в первой версии?");
      lines.push("**Обязательно должны успешно выполняться:** не указано — уточнить.");
    }
    lines.push("");

    // 13. Уточнения
    lines.push("## 13. Вопросы, которые нужно уточнить");
    lines.push("");
    if (clarifications.length === 0) {
      lines.push("Существенных пробелов по обязательным полям формы не выявлено. Перед реализацией всё равно проверьте документ на полноту.");
    } else {
      lines.push(bulletList(clarifications));
    }
    lines.push("");

    // 14. Инструкция
    lines.push("## 14. Инструкция приложению для разработки");
    lines.push("");
    lines.push(
      "Сначала изучи требования. Если есть существенные неопределённости, задай уточняющие вопросы. Затем предложи план реализации первой версии. Не добавляй функции вне согласованного объёма. После реализации объясни, как запустить проект и проверить критерии приёмки. Не выполняй публикацию, commit или push без отдельной команды."
    );
    lines.push("");

    return lines.join("\n");
  }

  function formHasData() {
    var fields = form.querySelectorAll("input[type='text'], textarea, select");
    for (var i = 0; i < fields.length; i += 1) {
      var el = fields[i];
      if (el.id === "result") {
        continue;
      }
      if (hasText(el.value)) {
        return true;
      }
    }
    var radios = ["needAuth", "needPay", "needSave", "needAi"];
    for (var r = 0; r < radios.length; r += 1) {
      if (getRadioValue(radios[r]) !== "Пока не знаю") {
        return true;
      }
    }
    if (getRadioValue("device")) {
      return true;
    }
    if (hasText(resultArea.value)) {
      return true;
    }
    return false;
  }

  function resetForm() {
    form.reset();
    actionsList.innerHTML = "";
    actionsList.appendChild(createActionRow(""));
    updateRemoveButtons();
    clearErrors();
    resultArea.value = "";
    lastBuiltText = "";
    document.getElementById("product-idea").focus();
  }

  addActionBtn.addEventListener("click", function () {
    var row = createActionRow("");
    actionsList.appendChild(row);
    updateRemoveButtons();
    row.querySelector(".action-input").focus();
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var data = validate();
    if (!data) {
      return;
    }

    var currentResult = resultArea.value;
    if (
      hasText(currentResult) &&
      currentResult !== lastBuiltText
    ) {
      var replaceOk = window.confirm(
        "В поле «Ваше ТЗ» есть ручные правки. При повторной сборке они будут заменены. Продолжить?"
      );
      if (!replaceOk) {
        return;
      }
    } else if (hasText(currentResult) && currentResult === lastBuiltText) {
      var rebuildOk = window.confirm(
        "ТЗ уже собрано. Собрать заново и заменить текущий документ?"
      );
      if (!rebuildOk) {
        return;
      }
    }

    var doc = buildDocument(data);
    resultArea.value = doc;
    lastBuiltText = doc;
    resultArea.focus();
  });

  clearBtn.addEventListener("click", function () {
    if (formHasData()) {
      var ok = window.confirm("Очистить все ответы и готовое ТЗ?");
      if (!ok) {
        return;
      }
    }
    resetForm();
  });

  actionsList.appendChild(createActionRow(""));
  updateRemoveButtons();
})();
