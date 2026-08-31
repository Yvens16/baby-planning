import { thisDevice, type ProtoState } from "./mock-data";

export function grant(state: ProtoState): ProtoState {
  const hasThis = state.devices.some((d) => d.isThis);
  return {
    ...state,
    permission: "granted",
    devices: hasThis ? state.devices : [thisDevice(), ...state.devices],
  };
}

export function deny(state: ProtoState): ProtoState {
  return { ...state, permission: "denied" };
}

export function resetBrowser(state: ProtoState): ProtoState {
  if (state.permission !== "denied") return state;
  return { ...state, permission: "default" };
}

export function install(state: ProtoState): ProtoState {
  return { ...state, installed: true };
}

export function dropDevice(state: ProtoState, id: string): ProtoState {
  const next = state.devices.filter((d) => d.id !== id);
  const stillThis = next.some((d) => d.isThis);
  return {
    ...state,
    devices: next,
    permission: stillThis ? state.permission : "default",
  };
}

export function signOutThis(state: ProtoState): ProtoState {
  const thisOne = state.devices.find((d) => d.isThis);
  if (!thisOne) return { ...state, permission: "default" };
  return dropDevice(state, thisOne.id);
}
