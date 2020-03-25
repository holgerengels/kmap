import {createModel} from '@captaincodeman/rdx-model';
import { Store } from '../store';
import {endpoint, fetchjson} from "../endpoint";
import {urls} from "../urls";
import {Upload} from "./types";

export interface UploadState {
  uploads: Upload[];
  error: string,
}

export default createModel({
  state: <UploadState>{
    error: "",
    uploads: [],
  },
  reducers: {
    startUpload(state, file: File) {
      return { ...state,
        uploads: [{ file: file, uploading: true}, ...state.uploads],
        error: "",
      };
    },
    finishedUpload(state, file: File) {
      return { ...state,
        uploads: [...state.uploads.map(u => { if (u.file === file) u.uploading = false ; return u; } )],
      };
    },
    clearUploads(state) {
      return { ...state,
        uploads: [],
      };
    },

    error(state, message) {
      return { ...state,
        error: message,
      }
    },
  },

  // @ts-ignore
  effects: (store: Store) => ({
    async upload(file: File) {
      const dispatch = store.dispatch();
      const state = store.getState();

      var formData: FormData = new FormData();
      formData.append('files', file);

      dispatch.uploads.startUpload(file);
      fetchjson(`${urls.server}edit?upload=${file.name}`, {... endpoint.postFormData(state), body: formData},
        () => {
          dispatch.uploads.finishedUpload(file);
        },
        dispatch.app.handleError,
        dispatch.uploads.error);
    },

    'app/receivedLogout': async function() {
      const dispatch = store.dispatch();
      dispatch.uploads.clearUploads();
    },
  })
})
