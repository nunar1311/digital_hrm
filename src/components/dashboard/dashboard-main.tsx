"use client";

import "gridstack/dist/gridstack.min.css";

import { GridStackRender } from "@/contexts/grid-stack-render";
import CardChartPie from "./cards/card-chart-pie";
import CardChartAreaInteractive from "./cards/card-chart-area-interactive";
import CardWidgetCalculation from "./cards/card-widget-calculation";
import CardWidgetList from "./cards/card-widget-list";
import CardChartTurnoverRate from "./cards/card-chart-turnover-rate";
import CardChartGender from "./cards/card-chart-gender";
import CardComingSoon from "./cards/card-coming-soon";
import CardTimesheetSummary from "./cards/card-timesheet-summary";
import CardContractExpiryList from "./cards/card-contract-expiry-list";
import CardAIExecutiveSummary from "./cards/card-ai-executive-summary";

const DashboardMain = () => {
  return (
    <GridStackRender
      componentMap={{
        cardChartPie: CardChartPie,
        cardChartAreaInteractive: CardChartAreaInteractive,
        cardChartTurnoverRate: CardChartTurnoverRate,
        cardChartGender: CardChartGender,
        totalEmployees: CardWidgetCalculation,
        totalEmployeesWorking: CardWidgetCalculation,
        newEmployees: CardWidgetCalculation,
        resignedEmployees: CardWidgetCalculation,
        listEmployees: CardWidgetList,
        cardComingSoon: CardComingSoon,
        cardTimesheetSummary: CardTimesheetSummary,
        cardContractExpiryList: CardContractExpiryList,
        cardAIExecutiveSummary: CardAIExecutiveSummary,
      }}
    />
  );
};

export default DashboardMain;
