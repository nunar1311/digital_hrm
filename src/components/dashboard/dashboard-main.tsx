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
            }}
        />
    );
};

export default DashboardMain;
