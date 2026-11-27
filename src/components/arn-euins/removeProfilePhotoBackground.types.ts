export type BgRemovalWorkerRequest = {
  type: "remove";
  buffer: ArrayBuffer;
  mimeType: string;
  fileName: string;
};

export type BgRemovalWorkerResponse =
  | {
      type: "progress";
      key: string;
      current: number;
      total: number;
      percent: number;
    }
  | {
      type: "done";
      buffer: ArrayBuffer;
      mimeType: string;
      fileName: string;
    }
  | {
      type: "error";
      message: string;
    };
