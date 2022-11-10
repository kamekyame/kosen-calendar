files="*/update*.ts"

for filepath in $files; do
  echo  $filepath
  if [ "$1" = "update" ]; then
    deno run -A $filepath
  elif [ "$1" = "check" ]; then
    deno check $filepath
  fi
done
