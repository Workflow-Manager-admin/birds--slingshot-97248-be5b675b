#!/bin/bash
cd /home/kavia/workspace/code-generation/birds--slingshot-97248-be5b675b/fun_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

