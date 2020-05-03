import React, {
  Dispatch,
  Reducer,
  ReducerAction,
  ReducerState,
  useEffect,
  useReducer,
  useState,
} from "react";
import { AsyncStorage } from "react-native";
import reduceReducers from "reduce-reducers";

const SET_STATE = "SetState-5fad7ff6-2e73-4b72-92e2-7a0100344a46";

interface SetStateAction {
  type: typeof SET_STATE;
  state: any;
}

const setState = (state: any) => ({
  type: SET_STATE,
  state,
});

const setStateReducer = (state: any, action: SetStateAction | any): any => {
  if (action.type == SET_STATE) {
    return action.state;
  }
  return state;
};

export function useStoredReducer<R extends Reducer<any, any>>(
  reducer: R,
  initialState: ReducerState<R>,
  storageName: string
): [ReducerState<R>, Dispatch<ReducerAction<R>>] {
  const [state, dispatch] = useReducer(
    reduceReducers(initialState, reducer, setStateReducer),
    initialState
  );
  const [loadedFromStorage, setLoadedFromStorage] = useState(false);

  useEffect(() => {
    if (!loadedFromStorage) {
      return;
    }
    AsyncStorage.setItem(storageName, JSON.stringify(state));
  }, [state, loadedFromStorage]);

  useEffect(() => {
    AsyncStorage.getItem(storageName, (err, content) => {
      if (content) {
        const state = JSON.parse(content);
        dispatch(setState(state));
      }
    }).then(() => {
      setLoadedFromStorage(true);
    });
  }, []);

  return [state, dispatch];
}
