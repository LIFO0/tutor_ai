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

        <div className="flex w-full flex-col gap-4 text-left text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-300">
          <p className="text-zinc-600 dark:text-zinc-400">
            Здесь коротко объяснено, как пользоваться сервисом. Если что-то непонятно, покажи страницу
            взрослому или учителю.
          </p>

          <section className="flex flex-col gap-1">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
              Что такое «Мишка знает»
            </h2>
            <p>
              Это помощник для учёбы: можно задавать вопросы по школьным предметам и решать примеры. Мишка
              отвечает спокойно и по шагам, как репетитор в переписке.
            </p>
          </section>

          <section className="flex flex-col gap-1">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Как пользоваться чатом</h2>
            <p>
              Зайди на главную, выбери предмет и напиши свой вопрос в поле внизу. Откроется беседа с
              Мишкой: можно продолжать писать в том же окне. Слева в меню видны недавние разговоры; лишний
              можно удалить, если он больше не нужен.
            </p>
          </section>

          <section className="flex flex-col gap-1">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Задания с проверкой</h2>
            <p>
              В разделе «Задания» напиши тему урока (например, «дроби» или «ускорение»). Появится задача под
              твой класс. Реши её и отправь ответ - Мишка скажет, верно ли, и объяснит, если что-то не так.
            </p>
          </section>

          <section className="flex flex-col gap-1">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Цифры и примеры в ответах</h2>
            <p>
              Ответы Мишки с формулами и примерами выглядят аккуратно, как в учебнике. Если тебе нужно
              самому написать формулу в вопросе или в ответе к заданию, не обязательно набирать её с
              клавиатуры: рядом с полем для текста есть кнопка с значком суммы (∑). Нажми её - откроется
              маленькая «клавиатура» с готовыми кусками: нажимаешь нужное, и оно вставляется в текст.
            </p>
          </section>

          <section className="flex flex-col gap-1">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
              Не получается зайти или ответ не приходит
            </h2>
            <p>
              Проверь, что интернет включён, и обнови страницу (можно закрыть вкладку и открыть снова). Если
              проблема не проходит, расскажи об этом взрослому, учителю или тому, кто дал тебе доступ к
              сервису - они смогут помочь или связаться с теми, кто настраивает сайт.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
