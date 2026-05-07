import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

export default async function HelpPage() {
  if (!(await getCurrentUser())) redirect("/login");

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center px-4 py-10">
      <div className="flex w-full max-w-3xl flex-col gap-5">
        <h1 className="w-full text-center text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
          Помощь
        </h1>

        <div className="flex w-full flex-col gap-6 text-left text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-300">
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50/60 p-4 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-200">
            <p className="font-medium text-zinc-900 dark:text-zinc-50">Коротко</p>
            <p className="mt-1 text-zinc-600 dark:text-zinc-400">
              Здесь собрана инструкция по «Мишка знает». Если что-то непонятно, покажи эту страницу взрослому
              или учителю.
            </p>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Важно: «Мишка знает» — это искусственный интеллект. Он может ошибаться, поэтому ответы нужно
              перепроверять.
            </p>
          </div>

          <nav
            aria-label="Оглавление"
            className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Оглавление</p>
            <ul className="mt-2 grid gap-1.5 text-[15px]">
              <li>
                <a className="underline decoration-zinc-300 underline-offset-4 hover:text-zinc-900 dark:hover:text-zinc-50" href="#about">
                  Что такое «Мишка знает»
                </a>
              </li>
              <li>
                <a className="underline decoration-zinc-300 underline-offset-4 hover:text-zinc-900 dark:hover:text-zinc-50" href="#quickStart">
                  Быстрый старт (2 минуты)
                </a>
              </li>
              <li>
                <a className="underline decoration-zinc-300 underline-offset-4 hover:text-zinc-900 dark:hover:text-zinc-50" href="#chatHowTo">
                  Чат: как задать вопрос
                </a>
              </li>
              <li>
                <a className="underline decoration-zinc-300 underline-offset-4 hover:text-zinc-900 dark:hover:text-zinc-50" href="#chatHistory">
                  Чаты: история и удаление
                </a>
              </li>
              <li>
                <a className="underline decoration-zinc-300 underline-offset-4 hover:text-zinc-900 dark:hover:text-zinc-50" href="#mathKeyboard">
                  Формулы и кнопка ∑
                </a>
              </li>
              <li>
                <a className="underline decoration-zinc-300 underline-offset-4 hover:text-zinc-900 dark:hover:text-zinc-50" href="#tasks">
                  Задания с проверкой
                </a>
              </li>
              <li>
                <a className="underline decoration-zinc-300 underline-offset-4 hover:text-zinc-900 dark:hover:text-zinc-50" href="#settings">
                  Настройки ученика
                </a>
              </li>
              <li>
                <a className="underline decoration-zinc-300 underline-offset-4 hover:text-zinc-900 dark:hover:text-zinc-50" href="#faq">
                  Частые вопросы (FAQ)
                </a>
              </li>
              <li>
                <a className="underline decoration-zinc-300 underline-offset-4 hover:text-zinc-900 dark:hover:text-zinc-50" href="#project">
                  О проекте
                </a>
              </li>
            </ul>
          </nav>

          <section id="about" className="scroll-mt-24">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Что такое «Мишка знает»</h2>
            <p className="mt-1">
              «Мишка знает» — это помощник для учёбы. Здесь можно задавать вопросы по школьным темам и получать
              объяснения по шагам, как на занятии с репетитором в переписке.
            </p>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Сервис подходит для 5–11 классов. Если хочешь — выбирай предмет. Если не уверен, выбирай «Свободная
              тема»: Мишка попробует понять вопрос сам.
            </p>
          </section>

          <section id="quickStart" className="scroll-mt-24">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Быстрый старт (2 минуты)</h2>
            <div className="mt-2 grid gap-3">
              <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
                <p className="font-semibold text-zinc-900 dark:text-zinc-50">1) Начать чат</p>
                <ol className="mt-1 list-decimal space-y-1 pl-5">
                  <li>Открой «Главная».</li>
                  <li>Выбери предмет (или «Свободная тема»).</li>
                  <li>Напиши вопрос в поле внизу и отправь.</li>
                </ol>
                <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                  Если сверху видно «Мишка думает и печатает…» — подожди: ответ приходит постепенно.
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
                <p className="font-semibold text-zinc-900 dark:text-zinc-50">2) Получить задание и проверить ответ</p>
                <ol className="mt-1 list-decimal space-y-1 pl-5">
                  <li>Открой раздел «Задания».</li>
                  <li>Выбери предмет и напиши тему (например: «дроби», «закон Ома», «причастия»).</li>
                  <li>Нажми «Получить задание».</li>
                  <li>Реши и напиши ответ в поле «Ваш ответ».</li>
                  <li>Нажми «Проверить».</li>
                </ol>
              </div>
            </div>
          </section>

          <section id="chatHowTo" className="scroll-mt-24">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Чат: как задать вопрос</h2>
            <p className="mt-1">
              Чем точнее вопрос, тем лучше ответ. Можно писать простыми словами.
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                Напиши, что именно нужно: <span className="font-medium">объяснить</span>,{" "}
                <span className="font-medium">решить</span>, <span className="font-medium">проверить</span> или{" "}
                <span className="font-medium">разобрать ошибку</span>.
              </li>
              <li>Если есть условие задачи — вставь его полностью.</li>
              <li>
                Если Мишка ответил слишком кратко, напиши:{" "}
                <span className="font-medium">«объясни по шагам»</span>.
              </li>
            </ul>
            <div className="mt-3 rounded-2xl border border-zinc-200 bg-zinc-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/30">
              <p className="font-semibold text-zinc-900 dark:text-zinc-50">Примеры вопросов</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-zinc-700 dark:text-zinc-200">
                <li>«Объясни, как решать уравнения с дробями. Покажи на примере».</li>
                <li>«Реши задачу и объясни по шагам: … (условие)».</li>
                <li>«Я получил ответ 12. Проверь, где ошибка: …».</li>
              </ul>
            </div>
          </section>

          <section id="chatHistory" className="scroll-mt-24">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Чаты: история и удаление</h2>
            <p className="mt-1">
              Все разговоры сохраняются. Их можно открыть позже и продолжить.
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Раздел «Чаты» показывает список бесед и поиск «Поиск чатов».</li>
              <li>Кнопка «Новый чат» создаёт новую беседу.</li>
              <li>
                Чтобы удалить чат, нажми крестик <span className="font-medium">×</span> рядом с ним и подтверди
                «Удалить».
              </li>
            </ul>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Важно: удаление чата необратимо. После подтверждения сообщения восстановить нельзя.
            </p>
          </section>

          <section id="mathKeyboard" className="scroll-mt-24">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Формулы и кнопка ∑</h2>
            <p className="mt-1">
              Иногда в задачах удобнее писать формулы. Для этого рядом с полем ввода есть кнопка{" "}
              <span className="font-medium">∑</span>.
            </p>
            <ol className="mt-2 list-decimal space-y-1 pl-5">
              <li>Нажми кнопку ∑ — откроется математическая клавиатура.</li>
              <li>Нажимай нужные символы и заготовки — они вставятся в твой текст.</li>
              <li>Когда готово, отправляй сообщение или проверяй ответ.</li>
            </ol>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Если ты видел в интернете записи вроде <span className="font-medium">x^2</span> или{" "}
              <span className="font-medium">\\frac a b</span>, это просто способ записывать формулы текстом.
              Здесь он тоже работает.
            </p>
          </section>

          <section id="tasks" className="scroll-mt-24">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Задания с проверкой</h2>
            <p className="mt-1">
              В режиме заданий Мишка даёт одну задачу по выбранной теме и проверяет твой ответ.
            </p>
            <div className="mt-2 grid gap-3">
              <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
                <p className="font-semibold text-zinc-900 dark:text-zinc-50">Как получить задание</p>
                <ol className="mt-1 list-decimal space-y-1 pl-5">
                  <li>Открой раздел «Задания».</li>
                  <li>Выбери предмет.</li>
                  <li>Напиши тему (например: «проценты», «скорость», «запятые в сложном предложении»).</li>
                  <li>Нажми «Получить задание».</li>
                </ol>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
                <p className="font-semibold text-zinc-900 dark:text-zinc-50">Как проверить ответ</p>
                <ol className="mt-1 list-decimal space-y-1 pl-5">
                  <li>Прочитай задание в блоке «Задание».</li>
                  <li>Введи ответ в «Ваш ответ» (можно использовать ∑, если нужна формула).</li>
                  <li>Нажми «Проверить».</li>
                </ol>
                <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                  После проверки ты увидишь результат: «✅ Верно!» или «❌ Неверно», а затем объяснение.
                </p>
              </div>
            </div>
          </section>

          <section id="settings" className="scroll-mt-24">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Настройки ученика</h2>
            <p className="mt-1">
              В «Настройки» можно поменять данные профиля. Это влияет на то, как Мишка подбирает объяснение.
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                <span className="font-medium">Имя</span> и <span className="font-medium">класс</span>: чтобы
                объяснения были подходящего уровня.
              </li>
              <li>
                <span className="font-medium">Как обращаться к тебе в чате</span>: если хочешь, чтобы Мишка
                называл тебя коротко (например, «Саша»).
              </li>
              <li>
                <span className="font-medium">Аватар</span>: можно выбрать готового мишку или загрузить картинку
                и затем нажать «Сохранить изменения».
              </li>
            </ul>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Email привязан к аккаунту и не меняется в настройках.
            </p>
          </section>

          <section id="faq" className="scroll-mt-24">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Частые вопросы (FAQ)</h2>
            <div className="mt-2 grid gap-2">
              <details className="rounded-2xl border border-zinc-200 bg-white p-4 open:bg-zinc-50/60 dark:border-zinc-800 dark:bg-zinc-950 dark:open:bg-zinc-900/30">
                <summary className="cursor-pointer select-none font-semibold text-zinc-900 dark:text-zinc-50">
                  Не получается войти
                </summary>
                <div className="mt-2 space-y-2 text-zinc-700 dark:text-zinc-200">
                  <p>Проверь, что email и пароль введены без лишних пробелов.</p>
                  <p>Если всё равно не получается — покажи проблему взрослому или учителю.</p>
                </div>
              </details>
              <details className="rounded-2xl border border-zinc-200 bg-white p-4 open:bg-zinc-50/60 dark:border-zinc-800 dark:bg-zinc-950 dark:open:bg-zinc-900/30">
                <summary className="cursor-pointer select-none font-semibold text-zinc-900 dark:text-zinc-50">
                  Ответ не приходит / «зависло»
                </summary>
                <div className="mt-2 space-y-2 text-zinc-700 dark:text-zinc-200">
                  <p>Проверь интернет и подожди немного: иногда ответ приходит постепенно.</p>
                  <p>Обнови страницу. Можно закрыть вкладку и открыть снова.</p>
                  <p>Если проблема повторяется — сообщи взрослому или учителю.</p>
                </div>
              </details>
              <details className="rounded-2xl border border-zinc-200 bg-white p-4 open:bg-zinc-50/60 dark:border-zinc-800 dark:bg-zinc-950 dark:open:bg-zinc-900/30">
                <summary className="cursor-pointer select-none font-semibold text-zinc-900 dark:text-zinc-50">
                  Формула выглядит странно
                </summary>
                <div className="mt-2 space-y-2 text-zinc-700 dark:text-zinc-200">
                  <p>Попробуй вставлять формулы через кнопку ∑ — так меньше ошибок в записи.</p>
                  <p>Если копируешь формулу из другого места, убедись, что она вставилась полностью.</p>
                </div>
              </details>
              <details className="rounded-2xl border border-zinc-200 bg-white p-4 open:bg-zinc-50/60 dark:border-zinc-800 dark:bg-zinc-950 dark:open:bg-zinc-900/30">
                <summary className="cursor-pointer select-none font-semibold text-zinc-900 dark:text-zinc-50">
                  Мишка ошибся — что делать?
                </summary>
                <div className="mt-2 space-y-2 text-zinc-700 dark:text-zinc-200">
                  <p>Сначала перепроверь условие задачи и свои данные.</p>
                  <p>Попроси Мишку объяснить по шагам и показать, откуда взялся ответ.</p>
                  <p>
                    Если сомнения остаются — спроси учителя или сравни с учебником. Это нормально: ИИ иногда
                    ошибается.
                  </p>
                </div>
              </details>
              <details className="rounded-2xl border border-zinc-200 bg-white p-4 open:bg-zinc-50/60 dark:border-zinc-800 dark:bg-zinc-950 dark:open:bg-zinc-900/30">
                <summary className="cursor-pointer select-none font-semibold text-zinc-900 dark:text-zinc-50">
                  Я удалил чат и хочу вернуть
                </summary>
                <div className="mt-2 space-y-2 text-zinc-700 dark:text-zinc-200">
                  <p>Удалённые чаты восстановить нельзя. Перед удалением всегда проверяй, точно ли он не нужен.</p>
                </div>
              </details>
            </div>
          </section>

          <section id="project" className="scroll-mt-24">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">О проекте</h2>
            <p className="mt-1">
              «Мишка знает» сделан как учебный помощник: чтобы школьнику было проще разбираться в темах,
              тренироваться на заданиях и получать понятные объяснения.
            </p>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Автор: <span className="font-semibold text-zinc-900 dark:text-zinc-50">Рыженкова Валерия</span>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
