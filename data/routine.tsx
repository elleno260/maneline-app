export type RoutineStep = {
  id: string;
  step: string;
  product: string;
  status: "check" | "dash";
};

export const routineStepsData: RoutineStep[] = [
  {
    id: "1",
    step: "Cleanse",
    product: "SheaMoisture Retention Shampoo",
    status: "check",
  },
  {
    id: "2",
    step: "Deep Condition",
    product: "Mielle Honey Mask",
    status: "check",
  },
  {
    id: "3",
    step: "Leave-In Conditioner",
    product: "As I am Leave-In Detangler",
    status: "check",
  },
  {
    id: "4",
    step: "Seal",
    product: "Jamaican Castor Oil",
    status: "dash",
  },
  {
    id: "5",
    step: "Style",
    product: "Camille Rose Curl Cream",
    status: "check",
  },
];