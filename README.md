## Descrition
mongoose version 3 add version key to prevent concurrent operation to modifiy array index, which means it only operates on arrays  
if you use mongoose-update-if-current plugin to gain full occ support, you may meet [this issue](https://github.com/eoin-obrien/mongoose-update-if-current/issues/64)   
this tiny module aims to solve this problem

## Usage
check `usage.js` file to get demo