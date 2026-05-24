"use client";

import { ToolWorkflowLayout } from "@/components/layout/ToolWorkflowLayout";
import { ToolSidebarDocumentList } from "@/components/layout/ToolSidebarDocumentList";
import { ToolSidebarFileControls } from "@/components/layout/ToolSidebarFileControls";
import { FileUploader } from "@/components/tools/FileUploader";
import { ProgressBar } from "@/components/tools/ProgressBar";
import { ToolButton } from "@/components/tools/ToolButton";
import { PdfSigningWorkspace } from "@/app/fill-and-sign/components/PdfSigningWorkspace";
import { SavedSignaturesRow } from "@/app/fill-and-sign/components/SavedSignaturesRow";
import { SignatureVaultModal } from "@/app/fill-and-sign/components/SignatureVaultModal";
import { useFillAndSignState } from "@/app/fill-and-sign/useFillAndSignState";
import { usePdfPasswordUnlock } from "@/hooks/usePdfPasswordUnlock";
import { TOOL_SIDEBAR_CTA_CLASS, TOOL_THUMBNAIL_WORKSPACE } from "@/lib/ui/classes";
import { downloadBytes, sanitizeFilename } from "@/lib/pdf/download";
import {
  DEFAULT_STAMP_HEIGHT,
  DEFAULT_STAMP_WIDTH,
  STAMP_PRESETS,
} from "@/app/fill-and-sign/sign-assets";
import { mergePdfsInOrder } from "@/lib/pdf/merge-pdfs-in-order";
import { stampSignaturesOnPdf } from "@/lib/pdf/stamp-signatures";
import { useProcessingStore } from "@/stores/processing-store";
import { useSignatureVaultStore } from "@/stores/signature-vault-store";
import { useToastStore } from "@/stores/toast-store";

export default function FillAndSignTool() {
  const {
    documents,
    pages,
    placedSignatures,
    activeSignatureId,
    loadingPages,
    showVaultModal,
    addDocument,
    removeDocument,
    registerPageRef,
    placeSignature,
    updateSignature,
    removeSignature,
    applySignatureToAllPages,
    setActiveSignatureId,
    setShowVaultModal,
    resetWorkspace,
  } = useFillAndSignState();

  const { tryUnlock, modal } = usePdfPasswordUnlock();
  const { status, progress, message, setProcessing, setProgress, setDone, setError, reset } =
    useProcessingStore();
  const signatures = useSignatureVaultStore((state) => state.signatures);
  const removeVaultSignature = useSignatureVaultStore((state) => state.removeSignature);
  const pushToast = useToastStore((state) => state.pushToast);

  const addFiles = async (files: File[]) => {
    for (const incoming of files) {
      const unlocked = await tryUnlock(incoming);
      if (!unlocked) continue;

      try {
        await addDocument(unlocked.file, unlocked.password);
      } catch {
        setError("Could not load this PDF. Please try another file.");
        return;
      }
    }
  };

  const handleInitialUpload = async (files: File[]) => {
    reset();
    resetWorkspace();
    await addFiles(files);
  };

  const handleApplyAllPages = (id: string) => {
    const pageCount = applySignatureToAllPages(id);
    if (pageCount > 0) {
      pushToast("success", `Signature applied to all ${pageCount} pages.`);
    }
  };

  const downloadSignedPdf = async () => {
    if (documents.length === 0) return;

    if (placedSignatures.length === 0) {
      setError("Place at least one signature before downloading.");
      return;
    }

    reset();
    setProcessing("Preparing signed PDF…");

    try {
      setProgress(10, "Combining documents…");
      const mergedBytes = await mergePdfsInOrder(
        await Promise.all(
          documents.map(async (doc) => ({
            bytes: await doc.file.arrayBuffer(),
            password: doc.password,
          })),
        ),
      );

      const password = documents.length === 1 ? documents[0].password : undefined;
      const result = await stampSignaturesOnPdf(
        mergedBytes,
        password,
        placedSignatures,
        pages,
        (value, msg) => setProgress(value, msg),
      );

      const baseName =
        documents.length === 1
          ? sanitizeFilename(documents[0].displayName)
          : sanitizeFilename(documents[0].displayName) + "-combined";
      downloadBytes(result, `${baseName}-signed.pdf`, "application/pdf");
      setDone("Your signed PDF is ready!");
    } catch {
      setError("Could not create signed PDF. Please try again.");
    }
  };

  return (
    <>
      <ToolWorkflowLayout
        hasFiles={documents.length > 0}
        sidebarLabel="Signing options"
        workspaceClassName="flex min-h-0 flex-1 flex-col overflow-hidden !py-4 lg:!py-5"
        upload={
          <FileUploader
            onFiles={handleInitialUpload}
            accept={{ "application/pdf": [".pdf"] }}
            multiple
            label="Drop PDF files here"
            hint="Add one or more PDFs, place signatures on any page, then download a merged signed file"
          />
        }
        workspace={
          documents.length > 0 ? (
            <div className={`${TOOL_THUMBNAIL_WORKSPACE} h-full`}>
              <PdfSigningWorkspace
                pages={pages}
                placedSignatures={placedSignatures}
                activeSignatureId={activeSignatureId}
                loadingPages={loadingPages}
                registerPageRef={registerPageRef}
                onActivateSignature={(id) => setActiveSignatureId(id || null)}
                onUpdateSignature={updateSignature}
                onDeleteSignature={removeSignature}
                onApplyAllPages={handleApplyAllPages}
              />
            </div>
          ) : null
        }
        sidebar={
          documents.length > 0 ? (
            <>
              <ToolSidebarFileControls
                mode="multi"
                accept={{ "application/pdf": [".pdf"] }}
                onAdd={addFiles}
                onReplace={async (files) => {
                  resetWorkspace();
                  reset();
                  await addFiles(files);
                }}
                disabled={status === "processing" || loadingPages}
                addLabel="Add PDF"
                addHint="Append another PDF to sign and merge"
                replaceLabel="Replace all"
                replaceHint="Clear everything and start with new PDFs"
              />

              <ToolSidebarDocumentList
                documents={documents.map((doc) => ({
                  id: doc.id,
                  displayName: doc.displayName,
                  pageCount: doc.pageCount,
                }))}
                onRemove={removeDocument}
                disabled={status === "processing" || loadingPages}
              />

              <SavedSignaturesRow
                signatures={signatures}
                onSelect={(signature) => {
                  const isStamp = STAMP_PRESETS.some((stamp) => stamp.label === signature.label);
                  placeSignature(
                    signature.dataUrl,
                    signature.label,
                    isStamp
                      ? { width: DEFAULT_STAMP_WIDTH, height: DEFAULT_STAMP_HEIGHT }
                      : undefined,
                  );
                }}
                onRemove={removeVaultSignature}
                onAddSignature={() => setShowVaultModal(true)}
                onPlaceAsset={(dataUrl, label, size) => placeSignature(dataUrl, label, size)}
              />

              {status === "processing" ? (
                <ProgressBar progress={progress} label={message} />
              ) : null}

              <div className={`flex flex-col gap-3 ${TOOL_SIDEBAR_CTA_CLASS}`}>
                <ToolButton
                  onClick={downloadSignedPdf}
                  disabled={
                    status === "processing" || loadingPages || placedSignatures.length === 0
                  }
                  className="w-full"
                >
                  Download Signed PDF
                </ToolButton>
              </div>
            </>
          ) : null
        }
      />
      {modal}
      <SignatureVaultModal
        open={showVaultModal}
        onClose={() => setShowVaultModal(false)}
        onCreated={(dataUrl, label) => {
          const isStamp = STAMP_PRESETS.some((stamp) => stamp.label === label);
          placeSignature(
            dataUrl,
            label,
            isStamp ? { width: DEFAULT_STAMP_WIDTH, height: DEFAULT_STAMP_HEIGHT } : undefined,
          );
        }}
      />
    </>
  );
}
