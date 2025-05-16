"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LoaderCircle, ScanSearch } from "lucide-react";
import { Button } from "@/components/Internal/Button";
import useDeepResearch from "@/hooks/useDeepResearch";
import useAccurateTimer from "@/hooks/useAccurateTimer";
import { useTaskStore } from "@/store/task";

const MagicDown = dynamic(() => import("@/components/MagicDown"));
const MagicDownView = dynamic(() => import("@/components/MagicDown/View"));

function Feedback() {
  const { t } = useTranslation();
  const taskStore = useTaskStore();
  const { deepResearch } = useDeepResearch();
  const {
    formattedTime,
    start: accurateTimerStart,
    stop: accurateTimerStop,
  } = useAccurateTimer();
  const [isThinking, setIsThinking] = useState<boolean>(false);

  async function startDeepResearch() {
    try {
      accurateTimerStart();
      setIsThinking(true);
      await deepResearch();
    } finally {
      setIsThinking(false);
      accurateTimerStop();
    }
  }

  function handleClear() {
    taskStore.updateQuestions("");
  }

  return (
    <section className="p-6 border rounded-xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm transition-all relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-chart-4 via-primary to-chart-3"></div>
      <h3 className="font-bold text-xl border-b pb-3 mb-4 leading-10">
        {t("research.feedback.title")}
      </h3>
      {taskStore.questions !== "" ? (
        <div>
          <div className="rounded-xl border border-muted p-4 bg-white/30 dark:bg-slate-800/30">
            <h4 className="mb-2 text-base font-bold text-primary">
              {t("research.feedback.primaryQuestionTitle")}
            </h4>
            <div className="p-3 rounded-lg bg-secondary/10 mb-4">
              <MagicDownView>{taskStore.question}</MagicDownView>
            </div>
            <h4 className="mb-2 text-base font-bold text-primary">
              {t("research.feedback.suggestedQuestionsTitle")}
            </h4>
            <div className="rounded-lg">
              <MagicDown
                value={taskStore.questions}
                onChange={(value) => {
                  taskStore.updateQuestions(value);
                }}
              />
            </div>
          </div>
          <div className="flex justify-between mt-4">
            <Button
              className="px-4 font-medium border-accent text-accent hover:bg-accent/10 rounded-lg"
              type="button"
              variant="outline"
              disabled={isThinking}
              onClick={() => handleClear()}
            >
              {t("research.common.clear")}
            </Button>
            <Button
              className="px-4 font-medium bg-accent hover:bg-accent/90 hover:shadow-md hover:shadow-accent/20 rounded-lg"
              type="button"
              disabled={isThinking}
              onClick={() => startDeepResearch()}
            >
              {isThinking ? (
                <>
                  <LoaderCircle className="animate-spin mr-2" />
                  <span>{t("research.common.searching")}</span>
                  <small className="font-mono ml-2">{formattedTime}</small>
                </>
              ) : (
                t("research.common.startResearch")
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-muted-foreground text-center py-6">
          <ScanSearch className="w-10 h-10 mx-auto mb-3 opacity-50" />
          {t("research.feedback.emptyTip")}
        </div>
      )}
      {taskStore.reportPlan !== "" && (
        <div className="mt-6 p-4 border rounded-xl bg-white/30 dark:bg-slate-800/30">
          <h4 className="text-base font-bold text-primary mb-3">
            {t("research.feedback.reportPlan")}
          </h4>
          <MagicDown
            value={taskStore.reportPlan}
            onChange={(value) => taskStore.updateReportPlan(value)}
          />
          <Button
            className="w-full mt-4 rounded-lg font-medium text-base py-5 bg-gradient-to-r from-chart-3 to-chart-4 hover:shadow-md hover:shadow-chart-3/20 hover:from-chart-3 hover:to-chart-3 transition-all"
            disabled={isThinking}
            onClick={() => startDeepResearch()}
          >
            {isThinking ? (
              <>
                <LoaderCircle className="animate-spin mr-2" />
                <span>{t("research.common.searching")}</span>
                <small className="font-mono ml-2">{formattedTime}</small>
              </>
            ) : taskStore.tasks.length === 0 ? (
              t("research.common.startResearch")
            ) : (
              t("research.common.restartResearch")
            )}
          </Button>
        </div>
      )}
    </section>
  );
}

export default Feedback;
