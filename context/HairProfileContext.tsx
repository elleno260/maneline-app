import { createContext, useContext, useState } from "react";

export type HairProfile = {
  hairType: string;
  porosity: string;
  density: string;
  scalp: string;
  chemicalHistory: string;
  hairColor: string;
};

type HairProfileContextType = {
  hairProfile: HairProfile;
  setHairProfile: React.Dispatch<React.SetStateAction<HairProfile>>;
};

const HairProfileContext = createContext<HairProfileContextType | undefined>(
  undefined
);

export function HairProfileProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [hairProfile, setHairProfile] = useState<HairProfile>({
    hairType: "4C",
    porosity: "Low",
    density: "Fine",
    scalp: "Dandruff Prone",
    chemicalHistory: "Heat/Color Damage",
    hairColor: "Ash Brown",
  });

  return (
    <HairProfileContext.Provider value={{ hairProfile, setHairProfile }}>
      {children}
    </HairProfileContext.Provider>
  );
}

export function useHairProfile() {
  const context = useContext(HairProfileContext);

  if (!context) {
    throw new Error("useHairProfile must be used inside HairProfileProvider");
  }

  return context;
}