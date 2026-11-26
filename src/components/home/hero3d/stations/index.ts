import { station as energy } from "./energy";
import { station as compute } from "./compute";
import { station as link } from "./link";
import { station as intelligence } from "./intelligence";
import { station as taste } from "./taste";
import type { StationDef } from "../types";

export const STATIONS: StationDef[] = [energy, compute, link, intelligence, taste];
