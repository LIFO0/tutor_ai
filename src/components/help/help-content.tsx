import Link from "next/link";
import { FeedbackContacts } from "@/components/legal/feedback-contacts";

const sectionClass = "mt-8 scroll-mt-24";
const h2Class = "font-display text-lg font-semibold text-foreground";
const pClass = "mt-3 text-sm leading-relaxed text-muted-foreground";
const cardClass =
  "rounded-2xl border border-border bg-card p-4 text-sm leading-relaxed text-muted-foreground";
const linkClass =
  "text-[color:var(--color-accent)] underline-offset-2 hover:underline";

export function HelpContent() {
  return (
    <article className="mx-auto w-full max-w-3xl">
      <header className="pt-4">
        <h1 className="text-center font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Помощь
        </h1>
        <p className={`${pClass} text-center`}>
          Инструкция по сервису «Мишка знает» для учеников, родителей и учителей
        </p>
      </header>

      <div className="mt-6 flex w-full flex-col gap-6 text-left text-[15px] leading-relaxed text-foreground">
        <div className={`${cardClass} bg-muted/40`}>
          <p className="font-medium text-foreground">Коротко</p>
          <p className="mt-2">
            На этой странице собраны ответы на типичные вопросы о работе сервиса. Если что-то остаётся
            непонятным, воспользуйтесь оглавлением ниже или разделом «Частые вопросы».
          </p>
          <p className="mt-2">
            <strong className="text-foreground">Важно:</strong> «Мишка знает» использует искусственный
            интеллект. Ответы могут содержать ошибки — их следует перепроверять по учебнику, конспекту
            или с помощью учителя.
          </p>
        </div>

        <nav aria-label="Оглавление" className={cardClass}>
          <p className="text-sm font-semibold text-foreground">Оглавление</p>
          <ul className="mt-2 grid gap-1.5 text-[15px]">
            <li>
              <a className={linkClass} href="#about">
                О сервисе
              </a>
            </li>
            <li>
              <a className={linkClass} href="#getting-started">
                Кому подходит и с чего начать
              </a>
            </li>
            <li>
              <a className={linkClass} href="#auth">
                Регистрация и вход
              </a>
            </li>
            <li>
              <a className={linkClass} href="#quickStart">
                Быстрый старт
              </a>
            </li>
            <li>
              <a className={linkClass} href="#chatHowTo">
                Чат: как задать вопрос
              </a>
            </li>
            <li>
              <a className={linkClass} href="#chatHistory">
                Чаты: история и удаление
              </a>
            </li>
            <li>
              <a className={linkClass} href="#mathKeyboard">
                Формулы и кнопка ∑
              </a>
            </li>
            <li>
              <a className={linkClass} href="#tasks">
                Задания с проверкой
              </a>
            </li>
            <li>
              <a className={linkClass} href="#settings">
                Настройки профиля
              </a>
            </li>
            <li>
              <a className={linkClass} href="#safety">
                Безопасность и конфиденциальность
              </a>
            </li>
            <li>
              <a className={linkClass} href="#feedback">
                Вопросы и предложения
              </a>
            </li>
            <li>
              <a className={linkClass} href="#faq">
                Частые вопросы (FAQ)
              </a>
            </li>
            <li>
              <a className={linkClass} href="#project">
                О проекте
              </a>
            </li>
          </ul>
        </nav>

        <section id="about" className={sectionClass}>
          <h2 className={h2Class}>1. О сервисе</h2>
          <p className={pClass}>
            «Мишка знает» — это онлайн-помощник для учёбы в браузере. Вы можете задавать вопросы по
            школьным темам и получать пошаговые объяснения, как в переписке с репетитором.
          </p>
          <p className={pClass}>Сервис рассчитан на учащихся <strong className="text-foreground">5–11 классов</strong>.</p>
          <p className={pClass}>Доступные предметы:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li>математика;</li>
            <li>физика;</li>
            <li>русский язык;</li>
            <li>
              <strong className="text-foreground">свободная тема</strong> — если предмет не указан,
              сервис попытается определить его по формулировке вопроса.
            </li>
          </ul>
          <p className={pClass}>Основные возможности:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">Чат</strong> — диалог с ИИ-репетитором; ответ
              появляется постепенно (потоковая печать).
            </li>
            <li>
              <strong className="text-foreground">Задания</strong> — генерация задачи по теме и
              автоматическая проверка вашего ответа с разбором.
            </li>
            <li>
              <strong className="text-foreground">Профиль</strong> — имя, класс, аватар и настройка
              обращения в чате; уровень объяснений подстраивается под класс.
            </li>
          </ul>
        </section>

        <section id="getting-started" className={sectionClass}>
          <h2 className={h2Class}>2. Кому подходит и с чего начать</h2>
          <p className={pClass}>
            <strong className="text-foreground">Ученикам</strong> — для подготовки к урокам, разбора
            домашних заданий и тренировки по темам.
          </p>
          <p className={pClass}>
            <strong className="text-foreground">Родителям</strong> — чтобы помочь ребёнку
            зарегистрироваться, выбрать класс и контролировать использование сервиса (особенно если
            ребёнку меньше 14 лет).
          </p>
          <p className={pClass}>
            <strong className="text-foreground">Учителям</strong> — как дополнительный инструмент
            объяснения; ответы ИИ рекомендуется использовать как подсказку, а не как единственный
            источник истины.
          </p>
          <div className={`${cardClass} mt-4`}>
            <p className="font-medium text-foreground">Первый визит</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5">
              <li>
                На главной странице нажмите «Попробовать бесплатно» или перейдите в раздел «Вход» /
                «Регистрация».
              </li>
              <li>Создайте аккаунт по email и паролю или войдите через Яндекс ID.</li>
              <li>
                Укажите класс (5–11) — от этого зависит сложность объяснений. При первом входе через
                Яндекс может появиться короткий шаг «выберите класс».
              </li>
              <li>Откройте «Главная» и начните чат или перейдите в «Задания».</li>
            </ol>
          </div>
          <p className={pClass}>
            Перед регистрацией необходимо ознакомиться с{" "}
            <Link href="/privacy" className={linkClass}>
              Политикой конфиденциальности
            </Link>
            .
          </p>
        </section>

        <section id="auth" className={sectionClass}>
          <h2 className={h2Class}>3. Регистрация и вход</h2>
          <p className={pClass}>Доступны два способа входа:</p>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">Email и пароль</strong> — на странице регистрации
              укажите имя, email, пароль (не менее 6 символов), класс и аватар. Отметьте согласие с
              политикой конфиденциальности.
            </li>
            <li>
              <strong className="text-foreground">Яндекс ID</strong> — нажмите «Войти через Яндекс» на
              странице входа или регистрации. Используются данные профиля Яндекса (email, имя, при
              наличии — фото).
            </li>
          </ul>
          <p className={pClass}>
            Если вы уже регистрировались через Яндекс, вход по email и паролю может быть недоступен —
            используйте кнопку Яндекса.
          </p>
          <p className={pClass}>
            При проблемах со входом см. раздел{" "}
            <a href="#faq" className={linkClass}>
              «Частые вопросы»
            </a>
            .
          </p>
        </section>

        <section id="quickStart" className={sectionClass}>
          <h2 className={h2Class}>4. Быстрый старт</h2>
          <div className="mt-4 grid gap-3">
            <div className={cardClass}>
              <p className="font-semibold text-foreground">Сценарий 1: задать вопрос в чате</p>
              <ol className="mt-2 list-decimal space-y-1 pl-5">
                <li>Войдите в аккаунт и откройте раздел «Главная».</li>
                <li>Выберите предмет или «Свободная тема».</li>
                <li>Введите вопрос в поле внизу экрана и отправьте сообщение.</li>
                <li>
                  Дождитесь ответа. Если отображается «Мишка думает и печатает…», подождите — текст
                  появляется постепенно.
                </li>
              </ol>
            </div>
            <div className={cardClass}>
              <p className="font-semibold text-foreground">Сценарий 2: получить задание и проверить ответ</p>
              <ol className="mt-2 list-decimal space-y-1 pl-5">
                <li>Откройте раздел «Задания».</li>
                <li>Выберите предмет и укажите тему (например: «дроби», «закон Ома», «причастие»).</li>
                <li>Нажмите «Получить задание».</li>
                <li>Решите задачу и введите ответ в поле «Ваш ответ».</li>
                <li>Нажмите «Проверить» и прочитайте результат и разбор.</li>
              </ol>
            </div>
          </div>
        </section>

        <section id="chatHowTo" className={sectionClass}>
          <h2 className={h2Class}>5. Чат: как задать вопрос</h2>
          <p className={pClass}>
            Чем точнее сформулирован вопрос, тем полезнее будет ответ. Можно писать обычными словами,
            без специальных терминов оформления.
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li>
              Укажите, что нужно: <strong className="text-foreground">объяснить</strong>,{" "}
              <strong className="text-foreground">решить</strong>,{" "}
              <strong className="text-foreground">проверить</strong> или{" "}
              <strong className="text-foreground">разобрать ошибку</strong>.
            </li>
            <li>Если есть условие задачи — скопируйте или введите его полностью.</li>
            <li>
              Если ответ слишком краткий, попросите: «объясните по шагам» или «покажите решение с
              пояснениями».
            </li>
          </ul>
          <div className={`${cardClass} mt-4 bg-muted/40`}>
            <p className="font-semibold text-foreground">Примеры вопросов</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>«Объясните, как решать уравнения с дробями. Покажите на примере».</li>
              <li>«Решите задачу и объясните по шагам: … (условие)».</li>
              <li>«Я получил ответ 12. Проверьте, где могла быть ошибка: …».</li>
            </ul>
          </div>
          <p className={pClass}>
            В начале диалога сервис может автоматически предложить заголовок чата и уточнить предмет по
            смыслу ваших сообщений.
          </p>
          <p className={pClass}>
            При очень частых запросах сервис может попросить подождать до следующего дня — подробнее в
            разделе «Частые вопросы» ниже.
          </p>
        </section>

        <section id="chatHistory" className={sectionClass}>
          <h2 className={h2Class}>6. Чаты: история и удаление</h2>
          <p className={pClass}>
            Все беседы сохраняются в аккаунте. Вы можете вернуться к ним позже и продолжить диалог.
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li>Раздел «Чаты» показывает список бесед и поле «Поиск чатов».</li>
            <li>Кнопка «Новый чат» создаёт новую беседу.</li>
            <li>
              Чтобы удалить чат, нажмите крестик (<strong className="text-foreground">×</strong>) рядом
              с ним и подтвердите действие.
            </li>
          </ul>
          <p className={pClass}>
            <strong className="text-foreground">Важно:</strong> удаление чата необратимо. После
            подтверждения восстановить сообщения нельзя.
          </p>
        </section>

        <section id="mathKeyboard" className={sectionClass}>
          <h2 className={h2Class}>7. Формулы и кнопка ∑</h2>
          <p className={pClass}>
            Для математических и физических записей рядом с полем ввода есть кнопка{" "}
            <strong className="text-foreground">∑</strong> (математическая клавиатура).
          </p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
            <li>Нажмите ∑ — откроется панель символов и формул.</li>
            <li>Выберите нужные элементы — они вставятся в текст сообщения или ответа.</li>
            <li>Отправьте сообщение или нажмите «Проверить» в режиме заданий.</li>
          </ol>
          <p className={pClass}>
            Поддерживается и текстовая запись формул (например, x^2 или дроби через специальные
            символы), если вы привыкли к такому формату.
          </p>
        </section>

        <section id="tasks" className={sectionClass}>
          <h2 className={h2Class}>8. Задания с проверкой</h2>
          <p className={pClass}>
            В разделе «Задания» сервис формирует одну задачу по выбранной теме и проверяет введённый
            вами ответ.
          </p>
          <div className="mt-4 grid gap-3">
            <div className={cardClass}>
              <p className="font-semibold text-foreground">Как получить задание</p>
              <ol className="mt-2 list-decimal space-y-1 pl-5">
                <li>Откройте «Задания».</li>
                <li>Выберите предмет.</li>
                <li>Укажите тему (например: «проценты», «скорость», «запятые в сложном предложении»).</li>
                <li>Нажмите «Получить задание».</li>
              </ol>
            </div>
            <div className={cardClass}>
              <p className="font-semibold text-foreground">Как проверить ответ</p>
              <ol className="mt-2 list-decimal space-y-1 pl-5">
                <li>Прочитайте текст в блоке «Задание».</li>
                <li>Введите решение в «Ваш ответ» (при необходимости используйте ∑).</li>
                <li>Нажмите «Проверить».</li>
              </ol>
              <p className="mt-2">
                Вы увидите результат («Верно» или «Неверно») и краткий разбор. При сомнениях сверьтесь
                с учебником или учителем.
              </p>
            </div>
          </div>
        </section>

        <section id="settings" className={sectionClass}>
          <h2 className={h2Class}>9. Настройки профиля</h2>
          <p className={pClass}>
            В разделе «Настройки» (меню профиля) можно изменить данные, влияющие на работу сервиса:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">Имя</strong> и{" "}
              <strong className="text-foreground">класс</strong> — для подбора уровня объяснений.
            </li>
            <li>
              <strong className="text-foreground">Как обращаться в чате</strong> — короткая форма
              имени (например, «Алексей» вместо полного ФИО).
            </li>
            <li>
              <strong className="text-foreground">Аватар</strong> — встроенные изображения или загрузка
              своей картинки (до 2 МБ), затем «Сохранить изменения».
            </li>
          </ul>
          <p className={pClass}>
            Адрес email, привязанный к аккаунту при регистрации, в настройках изменить нельзя.
          </p>
        </section>

        <section id="safety" className={sectionClass}>
          <h2 className={h2Class}>10. Безопасность и конфиденциальность</h2>
          <p className={pClass}>
            Не вводите в чат лишние персональные данные: домашний адрес, паспортные данные, номера
            телефонов других людей и т.п., если это не требуется для учебного вопроса.
          </p>
          <p className={pClass}>
            Родителям и законным представителям рекомендуется контролировать использование сервиса
            несовершеннолетними, в том числе если ребёнку <strong className="text-foreground">меньше 14 лет</strong>{" "}
            — для таких пользователей требуется согласие родителя на обработку персональных данных
            (подробности в политике).
          </p>
          <p className={pClass}>
            Полные сведения о том, какие данные собираются и как ими распоряжаются, — в{" "}
            <Link href="/privacy" className={linkClass}>
              Политике конфиденциальности
            </Link>
            . По вопросам персональных данных напишите операторам сервиса — адреса в разделе{" "}
            <a href="#feedback" className={linkClass}>
              «Вопросы и предложения»
            </a>{" "}
            ниже или в{" "}
            <Link href="/privacy" className={linkClass}>
              политике конфиденциальности
            </Link>
            .
          </p>
        </section>

        <section id="feedback" className={sectionClass}>
          <h2 className={h2Class}>11. Вопросы и предложения</h2>
          <p className={pClass}>
            По техническим вопросам, ошибкам в работе сервиса и вашим предложениям по улучшению
            напишите на один из адресов ниже. Укажите в письме, с какого аккаунта вы обращаетесь
            (email), и кратко опишите ситуацию.
          </p>
          <FeedbackContacts />
        </section>

        <section id="faq" className={sectionClass}>
          <h2 className={h2Class}>12. Частые вопросы (FAQ)</h2>
          <div className="mt-4 grid gap-2">
            <details className={`${cardClass} open:bg-muted/30`}>
              <summary className="cursor-pointer select-none font-semibold text-foreground">
                Не получается войти или зарегистрироваться
              </summary>
              <div className="mt-2 space-y-2">
                <p>Проверьте, что email и пароль введены без лишних пробелов.</p>
                <p>Убедитесь, что при регистрации отмечено согласие с политикой конфиденциальности.</p>
                <p>
                  Если аккаунт создан через Яндекс — войдите через кнопку «Войти через Яндекс», а не по
                  email.
                </p>
                <p>Если проблема сохраняется — обратитесь к родителю, учителю или к операторам сервиса.</p>
              </div>
            </details>
            <details className={`${cardClass} open:bg-muted/30`}>
              <summary className="cursor-pointer select-none font-semibold text-foreground">
                Почему появляется сообщение о лимите на сегодня?
              </summary>
              <div className="mt-2 space-y-2">
                <p>
                  Сервис ограничивает количество обращений к ИИ за календарный день, чтобы работа
                  оставалась стабильной для всех пользователей.
                </p>
                <p>
                  Лимиты считаются отдельно для сообщений в чате, новых бесед, генерации задач и
                  проверки ответов. Когда лимит исчерпан, на экране появится подсказка; обычно
                  указано, когда можно снова отправлять запросы — на следующий календарный день по
                  московскому времени.
                </p>
                <p>
                  Если закончился лимит на <strong className="text-foreground">новые чаты</strong>, вы
                  можете продолжить уже открытую беседу в разделе «Чаты».
                </p>
                <p>
                  Подробнее о том, какие данные для этого учитываются, — в{" "}
                  <Link href="/privacy" className={linkClass}>
                    политике конфиденциальности
                  </Link>
                  . Если сообщение появляется ошибочно или постоянно, обратитесь к взрослому или
                  напишите операторам в разделе{" "}
                  <a href="#feedback" className={linkClass}>
                    «Вопросы и предложения»
                  </a>
                  .
                </p>
              </div>
            </details>
            <details className={`${cardClass} open:bg-muted/30`}>
              <summary className="cursor-pointer select-none font-semibold text-foreground">
                Ответ в чате не приходит или «зависло»
              </summary>
              <div className="mt-2 space-y-2">
                <p>Проверьте подключение к интернету.</p>
                <p>Подождите 1–2 минуты: ответ может появляться постепенно.</p>
                <p>Обновите страницу или закройте вкладку и откройте сайт снова.</p>
                <p>При повторении проблемы сообщите об этом взрослому или оператору сервиса.</p>
              </div>
            </details>
            <details className={`${cardClass} open:bg-muted/30`}>
              <summary className="cursor-pointer select-none font-semibold text-foreground">
                Формула отображается неправильно
              </summary>
              <div className="mt-2 space-y-2">
                <p>Попробуйте вводить формулы через кнопку ∑ — это снижает риск ошибок.</p>
                <p>При копировании из другого источника убедитесь, что формула вставилась полностью.</p>
              </div>
            </details>
            <details className={`${cardClass} open:bg-muted/30`}>
              <summary className="cursor-pointer select-none font-semibold text-foreground">
                Мишка дал неверный ответ — что делать?
              </summary>
              <div className="mt-2 space-y-2">
                <p>Перепроверьте условие задачи и свои вычисления.</p>
                <p>Попросите в чате объяснение по шагам и укажите, где возникло сомнение.</p>
                <p>
                  Сверьтесь с учебником, конспектом или учителем. Ошибки ИИ — известное ограничение
                  технологии.
                </p>
              </div>
            </details>
            <details className={`${cardClass} open:bg-muted/30`}>
              <summary className="cursor-pointer select-none font-semibold text-foreground">
                Можно ли восстановить удалённый чат?
              </summary>
              <div className="mt-2 space-y-2">
                <p>Нет. Удалённые беседы восстановить нельзя. Перед удалением убедитесь, что чат больше не нужен.</p>
              </div>
            </details>
            <details className={`${cardClass} open:bg-muted/30`}>
              <summary className="cursor-pointer select-none font-semibold text-foreground">
                Как родителю помочь ребёнку?
              </summary>
              <div className="mt-2 space-y-2">
                <p>Помогите зарегистрироваться, выбрать класс и прочитать эту страницу вместе с ребёнком.</p>
                <p>Объясните, что ответы ИИ нужно перепроверять.</p>
                <p>
                  При необходимости ознакомьтесь с{" "}
                  <Link href="/privacy" className={linkClass}>
                    политикой конфиденциальности
                  </Link>{" "}
                  и контролируйте, какие сведения ребёнок вводит в чат.
                </p>
              </div>
            </details>
            <details className={`${cardClass} open:bg-muted/30`}>
              <summary className="cursor-pointer select-none font-semibold text-foreground">
                Как удалить аккаунт и персональные данные?
              </summary>
              <div className="mt-2 space-y-2">
                <p>
                  Отправьте запрос на email операторов, указанные в{" "}
                  <Link href="/privacy" className={linkClass}>
                    политике конфиденциальности
                  </Link>
                  , с темой «ПДн / Мишка знает» и адресом email аккаунта. Срок рассмотрения — до 30
                  дней.
                </p>
              </div>
            </details>
          </div>
        </section>

        <section id="project" className={sectionClass}>
          <h2 className={h2Class}>13. О проекте</h2>
          <p className={pClass}>
            «Мишка знает» создан как учебный помощник: чтобы учащимся было проще разбираться в темах,
            тренироваться на задачах и получать понятные объяснения в удобном формате.
          </p>
          <p className={pClass}>
            Сайт:{" "}
            <a href="https://mishkaznaet.ru" className={linkClass}>
              https://mishkaznaet.ru
            </a>
          </p>
          <p className={pClass}>
            Автор: <strong className="text-foreground">Рыженкова Валерия</strong>
          </p>
        </section>
      </div>
    </article>
  );
}
